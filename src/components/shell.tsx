import { useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  FileStack,
  HeartPulse,
  History,
  LayoutDashboard,
  Menu,
  ScanLine,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  Workflow,
  X,
  RotateCcw,
  Link2,
  UserRound,
  SlidersHorizontal,
} from 'lucide-react';
import { useDemo, navigate } from '../store';
import { doctorExams, type Role } from '../model';
import { Modal, date } from './ui';
const links = {
  center: [
    ['', 'Overview', LayoutDashboard],
    ['intake', 'New patient intake', ClipboardList],
    ['bulk', 'Bulk workspace', FileStack],
    ['drafts', 'Saved drafts', History],
    ['patients', 'Patients & history', Users],
    ['doctors', 'Doctor directory', Stethoscope],
    ['integrations', 'Source integrations', Link2],
    ['settings', 'Settings', Settings],
  ],
  doctor: [
    ['', 'Inbox', LayoutDashboard],
    ['patients', 'Patient history', Users],
    ['notes', 'My private notes', ClipboardList],
    ['settings', 'Settings', Settings],
  ],
  admin: [
    ['', 'Overview', LayoutDashboard],
    ['centers', 'Centers', Building2],
    ['doctors', 'Doctor directory', Stethoscope],
    ['patients', 'Patients', Users],
    ['accounts', 'Accounts', UserRound],
    ['permissions', 'Access & permissions', ShieldCheck],
    ['fields', 'Patient fields', SlidersHorizontal],
    ['audit', 'Audit trail', History],
    ['jobs', 'Operations', Activity],
    ['integrations', 'Source integrations', Link2],
    ['settings', 'Settings', Settings],
  ],
} as const;
export function Brand() {
  return (
    <a className="brand" href="#/welcome" aria-label="DevsHub Imaging home">
      <img src="/brand/mark.svg" alt="" width="40" height="40" />
      <div>
        DevsHub<span>IMAGING</span>
      </div>
    </a>
  );
}
export function Shell({
  role,
  section,
  children,
}: {
  role: Exclude<Role, 'patient'>;
  section: string;
  children: ReactNode;
}) {
  const { state, update, reset } = useDemo();
  const [menu, setMenu] = useState(false),
    [bell, setBell] = useState(false),
    [resetOpen, setResetOpen] = useState(false);
  const eligible = new Set(
    doctorExams(state, sessionStorage.getItem('demo-doctor') || 'd1').map((e) => e.id),
  );
  const visibleEvents = state.notifications.filter(
    (n) => role !== 'doctor' || eligible.has(n.examId),
  );
  const unread = visibleEvents.filter((n) => !n.read).length;
  return (
    <div className="workspace">
      <a className="skip" href="#main">
        Skip to main content
      </a>
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <Brand />
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <div className="workspace-label">
          <ShieldCheck size={18} />
          <div>
            <strong>
              {role === 'center'
                ? 'Center workspace'
                : role === 'doctor'
                  ? 'Doctor workspace'
                  : 'Platform administration'}
            </strong>
            <small>
              {role === 'admin' ? 'Sample global workspace' : state.settings.centerName}
            </small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {links[role].map(([path, label, Icon]) => (
            <a
              key={path}
              href={`#/${role}${path ? '/' + path : ''}`}
              className={section === path ? 'active' : ''}
              onClick={() => setMenu(false)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {section === path ? <i /> : null}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="source-promise">
            <ShieldCheck size={20} />
            <strong>Originals, preserved.</strong>
            <p>
              Review every source.
              <br />
              Deliver with confidence.
            </p>
            <small>Private, reviewed access</small>
          </div>
          <button className="account" onClick={() => navigate('/welcome')}>
            <div className="avatar">
              {role === 'doctor' ? 'DR' : role === 'admin' ? 'AD' : 'SC'}
            </div>
            <div>
              <strong>
                {role === 'doctor'
                  ? 'Sample referring doctor'
                  : role === 'admin'
                    ? 'Sample Administrator'
                    : 'Sample Center Team'}
              </strong>
              <small>Switch demo role</small>
            </div>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      {menu ? <div className="menu-backdrop" onClick={() => setMenu(false)} /> : null}
      <div className="workspace-main">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            {role === 'admin' ? 'Administration' : role === 'doctor' ? 'Doctor' : 'Center'}{' '}
            <span>/</span> {links[role].find((x) => x[0] === section)?.[1] || 'Workspace'}
          </div>
          <div className="topbar-actions">
            <span className="demo-pill">
              <i />
              Interactive demo <span>• sample data</span>
            </span>
            <button
              className="icon-button"
              title="Reset sample workspace"
              aria-label="Reset demo"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="notification-button icon-button"
              aria-label="Notifications"
              onClick={() => setBell(!bell)}
            >
              <Bell size={19} />
              {unread ? <i /> : null}
            </button>
            <button className="role-switch" onClick={() => navigate('/welcome')}>
              {role === 'center' ? 'Center' : role === 'doctor' ? 'Doctor' : 'Administrator'}
              <ChevronDown size={14} />
            </button>
          </div>
          {bell ? (
            <div className="notifications">
              <div className="notifications-head">
                <h3>Notifications</h3>
                <button
                  className="text-link"
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      notifications: s.notifications.map((n) =>
                        visibleEvents.some((v) => v.id === n.id) ? { ...n, read: true } : n,
                      ),
                    }))
                  }
                >
                  Mark all read
                </button>
              </div>
              {visibleEvents.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  className="notification-row"
                  onClick={() => {
                    update((s) => ({
                      ...s,
                      notifications: s.notifications.map((x) =>
                        x.id === n.id ? { ...x, read: true } : x,
                      ),
                    }));
                    setBell(false);
                    navigate(`/${role}/exams/${n.examId}`);
                  }}
                >
                  <div className="event-icon">
                    <FileStack size={18} />
                  </div>
                  <div>
                    <strong>{n.text}</strong>
                    <small>Sample center · In-app event</small>
                  </div>
                  {!n.read ? <i /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="workspace-footer">
          <span>DevsHub Imaging</span>
          <span>Sample records only. Changes remain in this browser.</span>
          <a href="#/welcome">
            Explore another role <ArrowRight size={13} />
          </a>
        </footer>
      </div>
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset the interactive demo?"
        description="Restore the original sample records and remove your local demo changes and uploaded files."
      >
        <div className="modal-actions">
          <button onClick={() => setResetOpen(false)}>Keep exploring</button>
          <button
            className="primary"
            onClick={() => {
              reset();
              setResetOpen(false);
              navigate(`/${role}`);
            }}
          >
            Reset sample workspace
          </button>
        </div>
      </Modal>
    </div>
  );
}
export function Welcome() {
  return (
    <div className="welcome">
      <div className="welcome-inner">
        <header className="welcome-header">
          <Brand />
          <span className="demo-pill">
            <i />
            Interactive demo • sample data
          </span>
        </header>
        <main>
          <section className="welcome-hero" aria-labelledby="welcome-title">
            <div className="welcome-intro">
              <div className="eyebrow">CONNECTED CARE, BY DEVSHUB</div>
              <h1 id="welcome-title">
                One complete result.
                <br />
                <em>Every source, preserved.</em>
              </h1>
              <p>
                DevsHub Imaging connects imaging centers, referring doctors and patients. Follow
                a result from reviewed intake to a clear, complete handoff.
              </p>
              <div className="welcome-journey" aria-label="Connected patient result journey">
                <span>Center</span>
                <ArrowRight size={15} />
                <span>Doctor</span>
                <ArrowRight size={15} />
                <span>Patient</span>
              </div>
              <a
                className="guide-link"
                href="/product-guide.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Download product guide <ArrowRight size={16} />
              </a>
            </div>
            <div className="welcome-art">
              <img
                src="/brand/hero-monolith.webp"
                alt="DevsHub emblem illuminated in indigo on a midnight monolith"
                width="1200"
                height="1200"
                fetchPriority="high"
              />
              <span>Built around a complete handoff.</span>
            </div>
          </section>
          <section className="welcome-roles" aria-labelledby="roles-title">
            <div className="welcome-roles-heading">
              <div>
                <div className="eyebrow">EXPLORE THE EXPERIENCE</div>
                <h2 id="roles-title">Your role. Your workspace.</h2>
              </div>
              <p>Choose a role to start a sample journey.</p>
            </div>
            <div className="role-grid">
              {(
                [
                  {
                    role: 'center',
                    title: 'Imaging center',
                    icon: Building2,
                    text: 'Receive files, review each person and send a complete package.',
                    meta: 'Start with a new intake',
                  },
                  {
                    role: 'doctor',
                    title: 'Referring doctor',
                    icon: Stethoscope,
                    text: 'Open received originals, explore the reader and keep private notes.',
                    meta: 'Explore the result inbox',
                  },
                  {
                    role: 'admin',
                    title: 'Administrator',
                    icon: ShieldCheck,
                    text: 'Manage accounts, reviewed access, fields and recovery.',
                    meta: 'Review administration',
                  },
                  {
                    role: 'patient',
                    title: 'Patient PDF access',
                    icon: HeartPulse,
                    text: 'Preview and download a ready sample PDF, without an account.',
                    meta: 'Open a patient result',
                  },
                ] as const
              ).map((x) => (
                <button
                  key={x.role}
                  className="role-card"
                  onClick={() =>
                    navigate(x.role === 'patient' ? '/patient/e1-0' : `/${x.role}`)
                  }
                >
                  <span className="role-icon">
                    <x.icon size={24} />
                  </span>
                  <h3>{x.title}</h3>
                  <p>{x.text}</p>
                  <strong>
                    {x.meta}
                    <ArrowRight size={17} />
                  </strong>
                </button>
              ))}
            </div>
          </section>
        </main>
        <footer className="welcome-foot">
          <ShieldCheck size={17} />
          <p>
            Sample data only. No sign-in, external messages or real clinical records. Changes
            stay in this browser, and you can reset the demo at any time.
          </p>
          <span>DevsHub Imaging</span>
        </footer>
      </div>
    </div>
  );
}
