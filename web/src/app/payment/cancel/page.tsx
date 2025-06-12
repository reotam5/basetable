import RedirectPage from "../../../components/redirect-page";

const ErrorIcon = () => (
  <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
    <svg
      className="w-8 h-8 text-red-600 dark:text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </div>
);

export default function PaymentErrorPage() {
  return (
    <RedirectPage
      redirectPath="payment/cancel"
      title="Payment cancelled"
      description="Please try again later or contact support if there was an issue."
      icon={<ErrorIcon />}
    />
  );
}