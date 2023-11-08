import {
  useRef,
  useSyncExternalStore,
  createContext,
  ReactNode,
  useContext,
} from "react";

export type ContextType<T> = {
  state: T;
  storeChanges: Set<() => void>;
  dispatch: (callback: (state: T) => T) => void;
  subscribe: (onStoreChange: () => void) => () => void;
};

export const createStoreContext = <T,>(initState: () => T) => {
  const context = useRef<ContextType<T>>({
    state: initState(),
    storeChanges: new Set(),
    dispatch: (callback) => {
      context.state = callback(context.state);
      context.storeChanges.forEach((storeChange) => storeChange());
    },
    subscribe: (onStoreChange) => {
      context.storeChanges.add(onStoreChange);
      return () => {
        context.storeChanges.delete(onStoreChange);
      };
    },
  }).current;
  return context;
};

const StoreContext = createContext<ContextType<any>>(undefined as never);

export const StoreProvider = <T,>({
  children,
  initState,
}: {
  children: ReactNode;
  initState: () => T;
}) => {
  const context = createStoreContext(initState);
  return (
    <StoreContext.Provider value={context}>{children}</StoreContext.Provider>
  );
};

export const useSelector = <T, R>(getSnapshot: (state: T) => R) => {
  const context = useContext<ContextType<T>>(StoreContext);
  return useSyncExternalStore(
    context.subscribe,
    () => getSnapshot(context.state),
    () => getSnapshot(context.state)
  );
};

export const useDispatch = <T,>() => {
  const context = useContext<ContextType<T>>(StoreContext);
  return context.dispatch;
};

type StateType = { a: number; b: number; c: number };

const A = () => {
  const value = useSelector((state: StateType) => state.a);
  return <div>A:{value}</div>;
};
const B = () => {
  const value = useSelector((state: StateType) => state.b);
  return <div>B:{value}</div>;
};
const C = () => {
  const value = useSelector((state: StateType) => state.c);
  return <div>C:{value}</div>;
};

const Buttons = () => {
  const dispatch = useDispatch<StateType>();
  return (
    <div>
      <button
        onClick={() => dispatch((state) => ({ ...state, a: state.a + 1 }))}
      >
        A
      </button>
      <button
        onClick={() => dispatch((state) => ({ ...state, b: state.b + 1 }))}
      >
        B
      </button>
      <button
        onClick={() => dispatch((state) => ({ ...state, c: state.c + 1 }))}
      >
        C
      </button>
    </div>
  );
};

const Page = () => {
  return (
    <StoreProvider
      initState={() => ({
        a: 0,
        b: 10,
        c: 100,
      })}
    >
      <A />
      <B />
      <C />
      <Buttons />
    </StoreProvider>
  );
};
export default Page;
