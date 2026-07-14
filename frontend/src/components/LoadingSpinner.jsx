import LoadingAnimation from './LoadingAnimation';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return <LoadingAnimation message={message} />;
}
