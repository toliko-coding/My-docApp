import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');
const optionalIsoDate = z.union([isoDate, z.literal('')]).optional();

export const manualBillStatusSchema = z.enum(['pending', 'paid', 'partially_paid', 'unknown']);

export const billFormSchema = z
  .object({
    providerName: z.string().trim().min(1, 'Provider is required'),
    categoryId: z.string().min(1, 'Category is required'),
    amount: z
      .string()
      .trim()
      .min(1, 'Amount is required')
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, 'Enter a valid amount'),
    currency: z.string().length(3),
    issueDate: optionalIsoDate,
    dueDate: optionalIsoDate,
    billingPeriodStart: optionalIsoDate,
    billingPeriodEnd: optionalIsoDate,
    status: manualBillStatusSchema,
    paidDate: optionalIsoDate,
    invoiceNumber: z.string().trim().optional(),
    customerNumber: z.string().trim().optional(),
    referenceNumber: z.string().trim().optional(),
    paymentMethod: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.billingPeriodStart) === Boolean(data.billingPeriodEnd), {
    message: 'Billing period needs both a start and an end date',
    path: ['billingPeriodEnd'],
  })
  .refine((data) => data.status !== 'paid' || Boolean(data.paidDate), {
    message: 'Paid date is required when status is Paid',
    path: ['paidDate'],
  });

export type BillFormValues = z.infer<typeof billFormSchema>;

export const emptyBillFormValues: BillFormValues = {
  providerName: '',
  categoryId: '',
  amount: '',
  currency: 'ILS',
  issueDate: '',
  dueDate: '',
  billingPeriodStart: '',
  billingPeriodEnd: '',
  status: 'pending',
  paidDate: '',
  invoiceNumber: '',
  customerNumber: '',
  referenceNumber: '',
  paymentMethod: '',
  notes: '',
};
