export class VFS {
  store = new Map<string, VFile>();
  constructor(
    options: {
      store?: Map<string, VFile>;
    } = {},
  ) {
    if (options.store) this.store = options.store;
  }
  add<
    C extends ContentFn | undefined,
    SC extends ContentFn | undefined,
    CC extends ContentFn | undefined,
  >(vfile: {
    path: string;
    content?: C;
    serverContent?: SC;
    clientContent?: CC;
  }) {
    this.store.set(vfile.path, vfile);
    return vfile as {
      path: string;
      content: C;
      serverContent: SC;
      clientContent: CC;
    } satisfies VFile;
  }
  remove(path: string) {
    this.store.delete(path);
  }
  get(path: string) {
    return this.store.get(path);
  }
  has(path: string) {
    return this.store.has(path);
  }
}

type ContentFn = (path: string) => string | Promise<string>;

export type VFile = {
  path: string;
  content?: ContentFn;
  serverContent?: ContentFn;
  clientContent?: ContentFn;
  write?: boolean;
};

export function createVFile<
  C extends ContentFn | undefined,
  SC extends ContentFn | undefined,
  CC extends ContentFn | undefined,
>(vfile: {
  path: string;
  content?: C;
  serverContent?: SC;
  clientContent?: CC;
}) {
  return vfile as {
    path: string;
    content: C;
    serverContent: SC;
    clientContent: CC;
  } satisfies VFile;
}

// Global VFS instance;
const vfs = new VFS();
export const useVFS = () => vfs;
