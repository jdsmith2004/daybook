/* The morning check-in is retired (docs/plan.md, "Lessons first"). A tab or a link left on it goes to Today. */
import { Redirect } from 'expo-router';

export default function Morning() {
  return <Redirect href="/" />;
}
