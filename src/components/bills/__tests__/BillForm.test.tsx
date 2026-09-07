import { fireEvent, render, screen } from '@testing-library/react-native';

import { BillForm } from '@/components/bills/BillForm';
import { useCategories } from '@/hooks/use-categories';
import { useProviderSearch } from '@/hooks/use-providers';
import { I18nProvider } from '@/i18n';
import type { BillFormValues } from '@/schemas/bill-form.schema';
import { makeCategory } from '@/test-utils/fixtures';

jest.mock('@/hooks/use-categories', () => ({ useCategories: jest.fn() }));
jest.mock('@/hooks/use-providers', () => ({ useProviderSearch: jest.fn() }));

const mockUseCategories = useCategories as jest.Mock;
const mockUseProviderSearch = useProviderSearch as jest.Mock;

// name_en === name_he so the rendered chip label doesn't depend on which
// locale I18nProvider happens to detect in the test environment.
const electricity = makeCategory({ id: 'cat-electricity', key: 'electricity', name_en: 'Electricity', name_he: 'Electricity' });
const water = makeCategory({ id: 'cat-water', key: 'water', name_en: 'Water', name_he: 'Water' });

function renderForm(props: Partial<React.ComponentProps<typeof BillForm>> = {}) {
  const onSubmit = jest.fn();
  render(
    <I18nProvider>
      <BillForm onSubmit={onSubmit} submitLabel="Save" {...props} />
    </I18nProvider>,
  );
  return { onSubmit };
}

beforeEach(() => {
  mockUseCategories.mockReturnValue({ data: [electricity, water], isError: false, refetch: jest.fn() });
  mockUseProviderSearch.mockReturnValue({ data: [] });
});

async function fillMinimalValidForm() {
  fireEvent.changeText(screen.getByLabelText('Provider'), 'Electric Co');
  fireEvent.press(screen.getByRole('button', { name: 'Electricity' }));
  fireEvent.changeText(screen.getByLabelText('Amount'), '150.5');
}

describe('BillForm', () => {
  it('renders the category options from useCategories', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Electricity' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Water' })).toBeTruthy();
  });

  it('lets the user retry after categories fail to load, instead of just showing an empty picker', () => {
    const refetch = jest.fn();
    mockUseCategories.mockReturnValue({ data: [], isError: true, refetch });
    renderForm();

    fireEvent.press(screen.getByText(/retry/i));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty submit and reports the missing required fields, without calling onSubmit', () => {
    const { onSubmit } = renderForm();

    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Provider is required')).toBeTruthy();
    expect(screen.getByText('Category is required')).toBeTruthy();
    expect(screen.getByText('Amount is required')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits parsed values once the required fields are filled in', async () => {
    const { onSubmit } = renderForm();

    await fillMinimalValidForm();
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as BillFormValues;
    expect(submitted).toMatchObject({
      providerName: 'Electric Co',
      categoryId: 'cat-electricity',
      amount: '150.5',
      currency: 'ILS',
      status: 'pending',
    });
  });

  it('regression: auto-fills today as the paid date the instant Paid is selected, so a bare submit succeeds', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 4, 12, 0, 0)); // 2026-09-04
    const { onSubmit } = renderForm();

    await fillMinimalValidForm();
    fireEvent.press(screen.getByRole('button', { name: 'Paid' }));
    // The Paid-date field appears once status is Paid, pre-filled — the user
    // never has to touch it for the submit to succeed.
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as BillFormValues;
    expect(submitted.status).toBe('paid');
    expect(submitted.paidDate).toBe('2026-09-04');

    jest.useRealTimers();
  });

  it('does not complain about the billing period when neither date is set', async () => {
    const { onSubmit } = renderForm();

    await fillMinimalValidForm();
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(screen.queryByText('Billing period needs both a start and an end date')).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('rejects a billing period with only a start date set', async () => {
    const { onSubmit } = renderForm({
      initialValues: { billingPeriodStart: '2026-09-01', billingPeriodEnd: '' },
    });

    await fillMinimalValidForm();
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Billing period needs both a start and an end date')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('pre-fills from initialValues, e.g. when editing an existing bill', () => {
    renderForm({
      initialValues: { providerName: 'Existing Provider', categoryId: 'cat-water', amount: '42' },
      submitLabel: 'Save Changes',
    });

    expect(screen.getByDisplayValue('Existing Provider')).toBeTruthy();
    expect(screen.getByDisplayValue('42')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Water' })).toHaveProp('accessibilityState', { selected: true });
  });
});
