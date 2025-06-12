import RedirectPage from "../../../components/redirect-page";

const SuccessIcon = () => (
  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
    <svg
      className="w-8 h-8 text-green-600 dark:text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  </div>
);

export default function PaymentSuccessPage() {
  return (
    <RedirectPage
      redirectPath="payment/success"
      title="Payment successful"
      description="Your payment has been processed successfully. Thank you for using Basetable!"
      icon={<SuccessIcon />}
    />
  );
}