import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoProvider, useRoute } from './store';
import { Shell, Welcome } from './components/shell';
import { Dashboard } from './components/dashboard';
import { Bulk, Drafts, Intake } from './components/intake';
import { Patients } from './components/patients';
import { Notes, Result } from './components/results';
import { PatientView } from './components/patient';
import {
  Accounts,
  AuditPage,
  Centers,
  Doctors,
  Fields,
  Integrations,
  Jobs,
  Permissions,
  SettingsPage,
} from './components/administration';
import './style.css';
function App() {
  const route = useRoute();
  const [, portal, section = '', id] = route.split('/');
  if (portal === 'welcome' || !['center', 'doctor', 'admin', 'patient'].includes(portal || ''))
    return <Welcome />;
  if (portal === 'patient') return <PatientView id={section} />;
  const role = portal as 'center' | 'doctor' | 'admin';
  let content;
  if (!section) content = <Dashboard role={role} />;
  else if (section === 'intake' && role === 'center') content = <Intake id={id} />;
  else if (section === 'bulk' && role === 'center') content = <Bulk />;
  else if (section === 'drafts' && role === 'center') content = <Drafts />;
  else if (section === 'patients') content = <Patients role={role} id={id} />;
  else if (section === 'exams' && id) content = <Result id={id} role={role} />;
  else if (section === 'doctors') content = <Doctors />;
  else if (section === 'notes' && role === 'doctor') content = <Notes />;
  else if (section === 'accounts' && role === 'admin') content = <Accounts />;
  else if (section === 'permissions' && role === 'admin') content = <Permissions />;
  else if (section === 'fields' && role === 'admin') content = <Fields />;
  else if (section === 'audit' && role === 'admin') content = <AuditPage />;
  else if (section === 'jobs' && role === 'admin') content = <Jobs />;
  else if (section === 'centers' && role === 'admin') content = <Centers />;
  else if (section === 'integrations') content = <Integrations />;
  else if (section === 'settings') content = <SettingsPage role={role} />;
  else content = <Dashboard role={role} />;
  return (
    <Shell role={role} section={section}>
      {<div key={route}>{content}</div>}
    </Shell>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoProvider>
      <App />
    </DemoProvider>
  </StrictMode>,
);
