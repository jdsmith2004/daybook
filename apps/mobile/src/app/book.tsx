/* My playbook is now part of My plan (the Learned part). Old links land there. */
import { Redirect } from 'expo-router';

export default function Book() {
  return <Redirect href={{ pathname: '/plan', params: { pane: 'learned' } }} />;
}
