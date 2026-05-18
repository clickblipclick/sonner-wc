declare module '$wc' {
  export const toast: {
    (message: string, opts?: Record<string, unknown>): string | number;
    success: (message: string, opts?: Record<string, unknown>) => string | number;
    error: (message: string, opts?: Record<string, unknown>) => string | number;
    info: (message: string, opts?: Record<string, unknown>) => string | number;
    warning: (message: string, opts?: Record<string, unknown>) => string | number;
    loading: (message: string, opts?: Record<string, unknown>) => string | number;
    message: (message: string, opts?: Record<string, unknown>) => string | number;
    promise: <T>(
      p: Promise<T>,
      opts: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: unknown) => string);
      },
    ) => Promise<T>;
    custom: (render: (id: string | number) => HTMLElement, opts?: Record<string, unknown>) => string | number;
    dismiss: (id?: string | number) => void;
  };
}
