import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initialState, stamp, uid, type State } from './model';
const KEY = 'devshub-interactive-demo-v2';
function load() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null') as State | null;
    return value?.version === 2 ? value : initialState();
  } catch {
    return initialState();
  }
}
const Context = createContext<{
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  update: (fn: (s: State) => State, action?: string, detail?: string) => void;
  reset: () => void;
  toast: (text: string) => void;
  files: Map<string, File>;
} | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);
  const [message, setMessage] = useState('');
  const [files] = useState(() => new Map<string, File>());
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      setMessage('Your browser could not save demo changes. Keep this tab open.');
    }
  }, [state]);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(id);
  }, [message]);
  const update = (fn: (s: State) => State, action?: string, detail = '') =>
    setState((s) => {
      const next = fn(s);
      return action
        ? { ...next, audit: [{ id: uid(), action, detail, createdAt: stamp() }, ...next.audit] }
        : next;
    });
  return (
    <Context.Provider
      value={{
        state,
        setState,
        update,
        reset: () => {
          files.clear();
          setState(initialState());
          setMessage('The sample workspace has been reset.');
        },
        toast: setMessage,
        files,
      }}
    >
      {children}
      {message ? (
        <div className="toast" role="status">
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      ) : null}
    </Context.Provider>
  );
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing demo context');
  return value;
}
export const navigate = (route: string) => {
  window.location.hash = route;
  window.scrollTo(0, 0);
};
export function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/welcome');
  useEffect(() => {
    const change = () => setRoute(window.location.hash.slice(1) || '/welcome');
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  return route;
}
