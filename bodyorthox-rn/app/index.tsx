import { Redirect } from 'expo-router';

// Root index redirects based on auth state
export default function Index() {
  return <Redirect href="/(app)/patients" />;
}
