/* eslint-disable */
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

/** Deno provides extra properties on `import.meta`.  These are included here
 * to ensure that these are still available when using the Deno namespace in
 * conjunction with other type libs, like `dom`. */
declare interface ImportMeta {
  /** A string representation of the fully qualified module URL. */
  url: string;

  /** A flag that indicates if the current module is the main module that was
   * called when starting the program under Deno.
   *
   * ```ts
   * if (import.meta.main) {
   *   // this was loaded as the main module, maybe do some bootstrapping
   * }
   * ```
   */
  main: boolean;
}

/** Deno supports user timing Level 3 (see: https://w3c.github.io/user-timing)
 * which is not widely supported yet in other runtimes.  These types are here
 * so that these features are still available when using the Deno namespace
 * in conjunction with other type libs, like `dom`. */
declare interface Performance {
  /** Stores a timestamp with the associated name (a "mark"). */
  mark(markName: string, options?: PerformanceMarkOptions): PerformanceMark;

  /** Stores the `DOMHighResTimeStamp` duration between two marks along with the
   * associated name (a "measure"). */
  measure(
    measureName: string,
    options?: PerformanceMeasureOptions,
  ): PerformanceMeasure;
}

declare interface PerformanceMarkOptions {
  /** Metadata to be included in the mark. */
  // deno-lint-ignore no-explicit-any
  detail?: any;

  /** Timestamp to be used as the mark time. */
  startTime?: number;
}

declare interface PerformanceMeasureOptions {
  /** Metadata to be included in the measure. */
  // deno-lint-ignore no-explicit-any
  detail?: any;

  /** Timestamp to be used as the start time or string to be used as start
   * mark.*/
  start?: string | number;

  /** Duration between the start and end times. */
  duration?: number;

  /** Timestamp to be used as the end time or string to be used as end mark. */
  end?: string | number;
}

declare namespace Deno {
  /** A set of error constructors that are raised by Deno APIs. */
  export const errors: {
    NotFound: ErrorConstructor;
    PermissionDenied: ErrorConstructor;
    ConnectionRefused: ErrorConstructor;
    ConnectionReset: ErrorConstructor;
    ConnectionAborted: ErrorConstructor;
    NotConnected: ErrorConstructor;
    AddrInUse: ErrorConstructor;
    AddrNotAvailable: ErrorConstructor;
    BrokenPipe: ErrorConstructor;
    AlreadyExists: ErrorConstructor;
    InvalidData: ErrorConstructor;
    TimedOut: ErrorConstructor;
    Interrupted: ErrorConstructor;
    WriteZero: ErrorConstructor;
    UnexpectedEof: ErrorConstructor;
    BadResource: ErrorConstructor;
    Http: ErrorConstructor;
    Busy: ErrorConstructor;
  };

  /** The current process id of the runtime. */
  export const pid: number;

  /** Reflects the `NO_COLOR` environment variable.
   *
   * See: https://no-color.org/ */
  export const noColor: boolean;

  export interface TestDefinition {
    fn: () => void | Promise<void>;
    name: string;
    ignore?: boolean;
    /** If at lease one test has `only` set to true, only run tests that have
     * `only` set to true and fail the test suite. */
    only?: boolean;
    /** Check that the number of async completed ops after the test is the same
     * as number of dispatched ops. Defaults to true.*/
    sanitizeOps?: boolean;
    /** Ensure the test case does not "leak" resources - ie. the resource table
     * after the test has exactly the same contents as before the test. Defaults
     * to true. */
    sanitizeResources?: boolean;
  }

  /** Register a test which will be run when `deno test` is used on the command
   * line and the containing module looks like a test module.
   * `fn` can be async if required.
   * ```ts
   * import {assert, fail, assertEquals} from "https://deno.land/std/testing/asserts.ts";
   *
   * Deno.test({
   *   name: "example test",
   *   fn(): void {
   *     assertEquals("world", "world");
   *   },
   * });
   *
   * Deno.test({
   *   name: "example ignored test",
   *   ignore: Deno.build.os === "windows",
   *   fn(): void {
   *     // This test is ignored only on Windows machines
   *   },
   * });
   *
   * Deno.test({
   *   name: "example async test",
   *   async fn() {
   *     const decoder = new TextDecoder("utf-8");
   *     const data = await Deno.readFile("hello_world.txt");
   *     assertEquals(decoder.decode(data), "Hello world");
   *   }
   * });
   * ```
   */
  export function test(t: TestDefinition): void;

  /** Register a test which will be run when `deno test` is used on the command
   * line and the containing module looks like a test module.
   * `fn` can be async if required.
   *
   * ```ts
   * import {assert, fail, assertEquals} from "https://deno.land/std/testing/asserts.ts";
   *
   * Deno.test("My test description", ():void => {
   *   assertEquals("hello", "hello");
   * });
   *
   * Deno.test("My async test description", async ():Promise<void> => {
   *   const decoder = new TextDecoder("utf-8");
   *   const data = await Deno.readFile("hello_world.txt");
   *   assertEquals(decoder.decode(data), "Hello world");
   * });
   * ```
   * */
  export function test(name: string, fn: () => void | Promise<void>): void;

  /** Exit the Deno process with optional exit code. If no exit code is supplied
   * then Deno will exit with return code of 0.
   *
   * ```ts
   * Deno.exit(5);
   * ```
   */
  export function exit(code?: number): never;

  export const env: {
    /** Retrieve the value of an environment variable. Returns undefined if that
     * key doesn't exist.
     *
     * ```ts
     * console.log(Deno.env.get("HOME"));  // e.g. outputs "/home/alice"
     * console.log(Deno.env.get("MADE_UP_VAR"));  // outputs "Undefined"
     * ```
     * Requires `allow-env` permission. */
    get(key: string): string | undefined;

    /** Set the value of an environment variable.
     *
     * ```ts
     * Deno.env.set("SOME_VAR", "Value"));
     * Deno.env.get("SOME_VAR");  // outputs "Value"
     * ```
     *
     * Requires `allow-env` permission. */
    set(key: string, value: string): void;

    /** Delete the value of an environment variable.
     *
     * ```ts
     * Deno.env.set("SOME_VAR", "Value"));
     * Deno.env.delete("SOME_VAR");  // outputs "Undefined"
     * ```
     *
     * Requires `allow-env` permission. */
    delete(key: string): void;

    /** Returns a snapshot of the environment variables at invocation.
     *
     * ```ts
     * Deno.env.set("TEST_VAR", "A");
     * const myEnv = Deno.env.toObject();
     * console.log(myEnv.SHELL);
     * Deno.env.set("TEST_VAR", "B");
     * console.log(myEnv.TEST_VAR);  // outputs "A"
     * ```
     *
     * Requires `allow-env` permission. */
    toObject(): { [index: string]: string };
  };

  /**
   * Returns the path to the current deno executable.
   *
   * ```ts
   * console.log(Deno.execPath());  // e.g. "/home/alice/.local/bin/deno"
   * ```
   *
   * Requires `allow-read` permission.
   */
  export function execPath(): string;

  /**
   * Change the current working directory to the specified path.
   *
   * ```ts
   * Deno.chdir("/home/userA");
   * Deno.chdir("../userB");
   * Deno.chdir("C:\\Program Files (x86)\\Java");
   * ```
   *
   * Throws `Deno.errors.NotFound` if directory not found.
   * Throws `Deno.errors.PermissionDenied` if the user does not have access
   * rights
   *
   * Requires --allow-read.
   */
  export function chdir(directory: string): void;

  /**
   * Return a string representing the current working directory.
   *
   * If the current directory can be reached via multiple paths (due to symbolic
   * links), `cwd()` may return any one of them.
   *
   * ```ts
   * const currentWorkingDirectory = Deno.cwd();
   * ```
   *
   * Throws `Deno.errors.NotFound` if directory not available.
   *
   * Requires --allow-read
   */
  export function cwd(): string;

  export enum SeekMode {
    Start = 0,
    Current = 1,
    End = 2,
  }

  export interface Reader {
    /** Reads up to `p.byteLength` bytes into `p`. It resolves to the number of
     * bytes read (`0` < `n` <= `p.byteLength`) and rejects if any error
     * encountered. Even if `read()` resolves to `n` < `p.byteLength`, it may
     * use all of `p` as scratch space during the call. If some data is
     * available but not `p.byteLength` bytes, `read()` conventionally resolves
     * to what is available instead of waiting for more.
     *
     * When `read()` encounters end-of-file condition, it resolves to EOF
     * (`null`).
     *
     * When `read()` encounters an error, it rejects with an error.
     *
     * Callers should always process the `n` > `0` bytes returned before
     * considering the EOF (`null`). Doing so correctly handles I/O errors that
     * happen after reading some bytes and also both of the allowed EOF
     * behaviors.
     *
     * Implementations should not retain a reference to `p`.
     *
     * Use Deno.iter() to turn a Reader into an AsyncIterator.
     */
    read(p: Uint8Array): Promise<number | null>;
  }

  export interface ReaderSync {
    /** Reads up to `p.byteLength` bytes into `p`. It resolves to the number
     * of bytes read (`0` < `n` <= `p.byteLength`) and rejects if any error
     * encountered. Even if `read()` returns `n` < `p.byteLength`, it may use
     * all of `p` as scratch space during the call. If some data is available
     * but not `p.byteLength` bytes, `read()` conventionally returns what is
     * available instead of waiting for more.
     *
     * When `readSync()` encounters end-of-file condition, it returns EOF
     * (`null`).
     *
     * When `readSync()` encounters an error, it throws with an error.
     *
     * Callers should always process the `n` > `0` bytes returned before
     * considering the EOF (`null`). Doing so correctly handles I/O errors that happen
     * after reading some bytes and also both of the allowed EOF behaviors.
     *
     * Implementations should not retain a reference to `p`.
     *
     * Use Deno.iterSync() to turn a ReaderSync into an Iterator.
     */
    readSync(p: Uint8Array): number | null;
  }

  export interface Writer {
    /** Writes `p.byteLength` bytes from `p` to the underlying data stream. It
     * resolves to the number of bytes written from `p` (`0` <= `n` <=
     * `p.byteLength`) or reject with the error encountered that caused the
     * write to stop early. `write()` must reject with a non-null error if
     * would resolve to `n` < `p.byteLength`. `write()` must not modify the
     * slice data, even temporarily.
     *
     * Implementations should not retain a reference to `p`.
     */
    write(p: Uint8Array): Promise<number>;
  }

  export interface WriterSync {
    /** Writes `p.byteLength` bytes from `p` to the underlying data
     * stream. It returns the number of bytes written from `p` (`0` <= `n`
     * <= `p.byteLength`) and any error encountered that caused the write to
     * stop early. `writeSync()` must throw a non-null error if it returns `n` <
     * `p.byteLength`. `writeSync()` must not modify the slice data, even
     * temporarily.
     *
     * Implementations should not retain a reference to `p`.
     */
    writeSync(p: Uint8Array): number;
  }

  export interface Closer {
    close(): void;
  }

  export interface Seeker {
    /** Seek sets the offset for the next `read()` or `write()` to offset,
     * interpreted according to `whence`: `Start` means relative to the
     * start of the file, `Current` means relative to the current offset,
     * and `End` means relative to the end. Seek resolves to the new offset
     * relative to the start of the file.
     *
     * Seeking to an offset before the start of the file is an error. Seeking to
     * any positive offset is legal, but the behavior of subsequent I/O
     * operations on the underlying object is implementation-dependent.
     * It returns the number of cursor position.
     */
    seek(offset: number, whence: SeekMode): Promise<number>;
  }

  export interface SeekerSync {
    /** Seek sets the offset for the next `readSync()` or `writeSync()` to
     * offset, interpreted according to `whence`: `Start` means relative
     * to the start of the file, `Current` means relative to the current
     * offset, and `End` means relative to the end.
     *
     * Seeking to an offset before the start of the file is an error. Seeking to
     * any positive offset is legal, but the behavior of subsequent I/O
     * operations on the underlying object is implementation-dependent.
     */
    seekSync(offset: number, whence: SeekMode): number;
  }

  /** Copies from `src` to `dst` until either EOF (`null`) is read from `src` or
   * an error occurs. It resolves to the number of bytes copied or rejects with
   * the first error encountered while copying.
   *
   * ```ts
   * const source = await Deno.open("my_file.txt");
   * const buffer = new Deno.Buffer()
   * const bytesCopied1 = await Deno.copy(source, Deno.stdout);
   * const bytesCopied2 = await Deno.copy(source, buffer);
   * ```
   *
   * @param src The source to copy from
   * @param dst The destination to copy to
   * @param options Can be used to tune size of the buffer. Default size is 32kB
   */
  export function copy(
    src: Reader,
    dst: Writer,
    options?: {
      bufSize?: number;
    },
  ): Promise<number>;

  /** Turns a Reader, `r`, into an async iterator.
   *
   * ```ts
   * let f = await Deno.open("/etc/passwd");
   * for await (const chunk of Deno.iter(f)) {
   *   console.log(chunk);
   * }
   * f.close();
   * ```
   *
   * Second argument can be used to tune size of a buffer.
   * Default size of the buffer is 32kB.
   *
   * ```ts
   * let f = await Deno.open("/etc/passwd");
   * const iter = Deno.iter(f, {
   *   bufSize: 1024 * 1024
   * });
   * for await (const chunk of iter) {
   *   console.log(chunk);
   * }
   * f.close();
   * ```
   *
   * Iterator uses an internal buffer of fixed size for efficiency; it returns
   * a view on that buffer on each iteration. It is therefore caller's
   * responsibility to copy contents of the buffer if needed; otherwise the
   * next iteration will overwrite contents of previously returned chunk.
   */
  export function iter(
    r: Reader,
    options?: {
      bufSize?: number;
    },
  ): AsyncIterableIterator<Uint8Array>;

  /** Turns a ReaderSync, `r`, into an iterator.
   *
   * ```ts
   * let f = Deno.openSync("/etc/passwd");
   * for (const chunk of Deno.iterSync(f)) {
   *   console.log(chunk);
   * }
   * f.close();
   * ```
   *
   * Second argument can be used to tune size of a buffer.
   * Default size of the buffer is 32kB.
   *
   * ```ts
   * let f = await Deno.open("/etc/passwd");
   * const iter = Deno.iterSync(f, {
   *   bufSize: 1024 * 1024
   * });
   * for (const chunk of iter) {
   *   console.log(chunk);
   * }
   * f.close();
   * ```
   *
   * Iterator uses an internal buffer of fixed size for efficiency; it returns
   * a view on that buffer on each iteration. It is therefore caller's
   * responsibility to copy contents of the buffer if needed; otherwise the
   * next iteration will overwrite contents of previously returned chunk.
   */
  export function iterSync(
    r: ReaderSync,
    options?: {
      bufSize?: number;
    },
  ): IterableIterator<Uint8Array>;

  /** Synchronously open a file and return an instance of `Deno.File`.  The
   * file does not need to previously exist if using the `create` or `createNew`
   * open options.  It is the callers responsibility to close the file when finished
   * with it.
   *
   * ```ts
   * const file = Deno.openSync("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * Deno.close(file.rid);
   * ```
   *
   * Requires `allow-read` and/or `allow-write` permissions depending on options.
   */
  export function openSync(path: string | URL, options?: OpenOptions): File;

  /** Open a file and resolve to an instance of `Deno.File`.  The
   * file does not need to previously exist if using the `create` or `createNew`
   * open options.  It is the callers responsibility to close the file when finished
   * with it.
   *
   * ```ts
   * const file = await Deno.open("/foo/bar.txt", { read: true, write: true });
   * // Do work with file
   * Deno.close(file.rid);
   * ```
   *
   * Requires `allow-read` and/or `allow-write` permissions depending on options.
   */
  export function open(
    path: string | URL,
    options?: OpenOptions,
  ): Promise<File>;

  /** Creates a file if none exists or truncates an existing file and returns
   *  an instance of `Deno.File`.
   *
   * ```ts
   * const file = Deno.createSync("/foo/bar.txt");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   */
  export function createSync(path: string | URL): File;

  /** Creates a file if none exists or truncates an existing file and resolves to
   *  an instance of `Deno.File`.
   *
   * ```ts
   * const file = await Deno.create("/foo/bar.txt");
   * ```
   *
   * Requires `allow-read` and `allow-write` permissions.
   */
  export function create(path: string | URL): Promise<File>;

  /** Synchronously read from a resource ID (`rid`) into an array buffer (`buffer`).
   *
   * Returns either the number of bytes read during the operation or EOF
   * (`null`) if there was nothing more to read.
   *
   * It is possible for a read to successfully return with `0` bytes. This does
   * not indicate EOF.
   *
   * This function is one of the lowest level APIs and most users should not
   * work with this directly, but rather use Deno.readAllSync() instead.
   *
   * **It is not guaranteed that the full buffer will be read in a single call.**
   *
   * ```ts
   * // if "/foo/bar.txt" contains the text "hello world":
   * const file = Deno.openSync("/foo/bar.txt");
   * const buf = new Uint8Array(100);
   * const numberOfBytesRead = Deno.readSync(file.rid, buf); // 11 bytes
   * const text = new TextDecoder().decode(buf);  // "hello world"
   * Deno.close(file.rid);
   * ```
   */
  export function readSync(rid: number, buffer: Uint8Array): number | null;

  /** Read from a resource ID (`rid`) into an array buffer (`buffer`).
   *
   * Resolves to either the number of bytes read during the operation or EOF
   * (`null`) if there was nothing more to read.
   *
   * It is possible for a read to successfully return with `0` bytes. This does
   * not indicate EOF.
   *
   * This function is one of the lowest level APIs and most users should not
   * work with this directly, but rather use Deno.readAll() instead.
   *
   * **It is not guaranteed that the full buffer will be read in a single call.**
   *
   * ```ts
   * // if "/foo/bar.txt" contains the text "hello world":
   * const file = await Deno.open("/foo/bar.txt");
   * const buf = new Uint8Array(100);
   * const numberOfBytesRead = await Deno.read(file.rid, buf); // 11 bytes
   * const text = new TextDecoder().decode(buf);  // "hello world"
   * Deno.close(file.rid);
   * ```
   */
  export function read(rid: number, buffer: Uint8Array): Promise<number | null>;

  /** Synchronously write to the resource ID (`rid`) the contents of the array
   * buffer (`data`).
   *
   * Returns the number of bytes written.  This function is one of the lowest
   * level APIs and most users should not work with this directly, but rather use
   * Deno.writeAllSync() instead.
   *
   * **It is not guaranteed that the full buffer will be written in a single
   * call.**
   *
   * ```ts
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world");
   * const file = Deno.openSync("/foo/bar.txt", {write: true});
   * const bytesWritten = Deno.writeSync(file.rid, data); // 11
   * Deno.close(file.rid);
   * ```
   */
  export function writeSync(rid: number, data: Uint8Array): number;

  /** Write to the resource ID (`rid`) the contents of the array buffer (`data`).
   *
   * Resolves to the number of bytes written.  This function is one of the lowest
   * level APIs and most users should not work with this directly, but rather use
   * Deno.writeAll() instead.
   *
   * **It is not guaranteed that the full buffer will be written in a single
   * call.**
   *
   * ```ts
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world");
   * const file = await Deno.open("/foo/bar.txt", { write: true });
   * const bytesWritten = await Deno.write(file.rid, data); // 11
   * Deno.close(file.rid);
   * ```
   */
  export function write(rid: number, data: Uint8Array): Promise<number>;

  /** Synchronously seek a resource ID (`rid`) to the given `offset` under mode
   * given by `whence`.  The new position within the resource (bytes from the
   * start) is returned.
   *
   * ```ts
   * const file = Deno.openSync('hello.txt', {read: true, write: true, truncate: true, create: true});
   * Deno.writeSync(file.rid, new TextEncoder().encode("Hello world"));
   * // advance cursor 6 bytes
   * const cursorPosition = Deno.seekSync(file.rid, 6, Deno.SeekMode.Start);
   * console.log(cursorPosition);  // 6
   * const buf = new Uint8Array(100);
   * file.readSync(buf);
   * console.log(new TextDecoder().decode(buf)); // "world"
   * ```
   *
   * The seek modes work as follows:
   *
   * ```ts
   * // Given file.rid pointing to file with "Hello world", which is 11 bytes long:
   * // Seek 6 bytes from the start of the file
   * console.log(Deno.seekSync(file.rid, 6, Deno.SeekMode.Start)); // "6"
   * // Seek 2 more bytes from the current position
   * console.log(Deno.seekSync(file.rid, 2, Deno.SeekMode.Current)); // "8"
   * // Seek backwards 2 bytes from the end of the file
   * console.log(Deno.seekSync(file.rid, -2, Deno.SeekMode.End)); // "9" (e.g. 11-2)
   * ```
   */
  export function seekSync(
    rid: number,
    offset: number,
    whence: SeekMode,
  ): number;

  /** Seek a resource ID (`rid`) to the given `offset` under mode given by `whence`.
   * The call resolves to the new position within the resource (bytes from the start).
   *
   * ```ts
   * const file = await Deno.open('hello.txt', {read: true, write: true, truncate: true, create: true});
   * await Deno.write(file.rid, new TextEncoder().encode("Hello world"));
   * // advance cursor 6 bytes
   * const cursorPosition = await Deno.seek(file.rid, 6, Deno.SeekMode.Start);
   * console.log(cursorPosition);  // 6
   * const buf = new Uint8Array(100);
   * await file.read(buf);
   * console.log(new TextDecoder().decode(buf)); // "world"
   * ```
   *
   * The seek modes work as follows:
   *
   * ```ts
   * // Given file.rid pointing to file with "Hello world", which is 11 bytes long:
   * // Seek 6 bytes from the start of the file
   * console.log(await Deno.seek(file.rid, 6, Deno.SeekMode.Start)); // "6"
   * // Seek 2 more bytes from the current position
   * console.log(await Deno.seek(file.rid, 2, Deno.SeekMode.Current)); // "8"
   * // Seek backwards 2 bytes from the end of the file
   * console.log(await Deno.seek(file.rid, -2, Deno.SeekMode.End)); // "9" (e.g. 11-2)
   * ```
   */
  export function seek(
    rid: number,
    offset: number,
    whence: SeekMode,
  ): Promise<number>;

  /**
   * Synchronously flushes any pending data and metadata operations of the given file stream to disk.
   *  ```ts
   * const file = Deno.openSync("my_file.txt", { read: true, write: true, create: true });
   * Deno.writeSync(file.rid, new TextEncoder().encode("Hello World"));
   * Deno.ftruncateSync(file.rid, 1);
   * Deno.fsyncSync(file.rid);
   * console.log(new TextDecoder().decode(Deno.readFileSync("my_file.txt"))); // H
   * ```
   */
  export function fsyncSync(rid: number): void;

  /**
   * Flushes any pending data and metadata operations of the given file stream to disk.
   *  ```ts
   * const file = await Deno.open("my_file.txt", { read: true, write: true, create: true });
   * await Deno.write(file.rid, new TextEncoder().encode("Hello World"));
   * await Deno.ftruncate(file.rid, 1);
   * await Deno.fsync(file.rid);
   * console.log(new TextDecoder().decode(await Deno.readFile("my_file.txt"))); // H
   * ```
   */
  export function fsync(rid: number): Promise<void>;

  /*
   * Synchronously flushes any pending data operations of the given file stream to disk.
   *  ```ts
   * const file = Deno.openSync("my_file.txt", { read: true, write: true, create: true });
   * Deno.writeSync(file.rid, new TextEncoder().encode("Hello World"));
   * Deno.fdatasyncSync(file.rid);
   * console.log(new TextDecoder().decode(Deno.readFileSync("my_file.txt"))); // Hello World
   * ```
   */
  export function fdatasyncSync(rid: number): void;

  /**
   * Flushes any pending data operations of the given file stream to disk.
   *  ```ts
   * const file = await Deno.open("my_file.txt", { read: true, write: true, create: true });
   * await Deno.write(file.rid, new TextEncoder().encode("Hello World"));
   * await Deno.fdatasync(file.rid);
   * console.log(new TextDecoder().decode(await Deno.readFile("my_file.txt"))); // Hello World
   * ```
   */
  export function fdatasync(rid: number): Promise<void>;

  /** Close the given resource ID (rid) which has been previously opened, such
   * as via opening or creating a file.  Closing a file when you are finished
   * with it is important to avoid leaking resources.
   *
   * ```ts
   * const file = await Deno.open("my_file.txt");
   * // do work with "file" object
   * Deno.close(file.rid);
   * ````
   */
  export function close(rid: number): void;

  /** The Deno abstraction for reading and writing files. */
  export class File
    implements
    Reader,
    ReaderSync,
    Writer,
    WriterSync,
    Seeker,
    SeekerSync,
    Closer {
    readonly rid: number;
    constructor(rid: number);
    write(p: Uint8Array): Promise<number>;
    writeSync(p: Uint8Array): number;
    read(p: Uint8Array): Promise<number | null>;
    readSync(p: Uint8Array): number | null;
    seek(offset: number, whence: SeekMode): Promise<number>;
    seekSync(offset: number, whence: SeekMode): number;
    close(): void;
  }

  /** A handle for `stdin`. */
  export const stdin: Reader & ReaderSync & Closer & { readonly rid: number };
  /** A handle for `stdout`. */
  export const stdout: Writer & WriterSync & Closer & { readonly rid: number };
  /** A handle for `stderr`. */
  export const stderr: Writer & WriterSync & Closer & { readonly rid: number };

  export interface OpenOptions {
    /** Sets the option for read access. This option, when `true`, means that the
     * file should be read-able if opened. */
    read?: boolean;
    /** Sets the option for write access. This option, when `true`, means that
     * the file should be write-able if opened. If the file already exists,
     * any write calls on it will overwrite its contents, by default without
     * truncating it. */
    write?: boolean;
    /**Sets the option for the append mode. This option, when `true`, means that
     * writes will append to a file instead of overwriting previous contents.
     * Note that setting `{ write: true, append: true }` has the same effect as
     * setting only `{ append: true }`. */
    append?: boolean;
    /** Sets the option for truncating a previous file. If a file is
     * successfully opened with this option set it will truncate the file to `0`
     * size if it already exists. The file must be opened with write access
     * for truncate to work. */
    truncate?: boolean;
    /** Sets the option to allow creating a new file, if one doesn't already
     * exist at the specified path. Requires write or append access to be
     * used. */
    create?: boolean;
    /** Defaults to `false`. If set to `true`, no file, directory, or symlink is
     * allowed to exist at the target location. Requires write or append
     * access to be used. When createNew is set to `true`, create and truncate
     * are ignored. */
    createNew?: boolean;
    /** Permissions to use if creating the file (defaults to `0o666`, before
     * the process's umask).
     * Ignored on Windows. */
    mode?: number;
  }

  /**
   *
   *  Check if a given resource id (`rid`) is a TTY.
   *
   * ```ts
   * // This example is system and context specific
   * const nonTTYRid = Deno.openSync("my_file.txt").rid;
   * const ttyRid = Deno.openSync("/dev/tty6").rid;
   * console.log(Deno.isatty(nonTTYRid)); // false
   * console.log(Deno.isatty(ttyRid)); // true
   * Deno.close(nonTTYRid);
   * Deno.close(ttyRid);
   * ```
   */
  export function isatty(rid: number): boolean;

  /** A variable-sized buffer of bytes with `read()` and `write()` methods.
   *
   * Deno.Buffer is almost always used with some I/O like files and sockets. It
   * allows one to buffer up a download from a socket. Buffer grows and shrinks
   * as necessary.
   *
   * Deno.Buffer is NOT the same thing as Node's Buffer. Node's Buffer was
   * created in 2009 before JavaScript had the concept of ArrayBuffers. It's
   * simply a non-standard ArrayBuffer.
   *
   * ArrayBuffer is a fixed memory allocation. Deno.Buffer is implemented on top
   * of ArrayBuffer.
   *
   * Based on [Go Buffer](https://golang.org/pkg/bytes/#Buffer). */
  export class Buffer implements Reader, ReaderSync, Writer, WriterSync {
    constructor(ab?: ArrayBuffer);
    /** Returns a slice holding the unread portion of the buffer.
     *
     * The slice is valid for use only until the next buffer modification (that
     * is, only until the next call to a method like `read()`, `write()`,
     * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
     * least until the next buffer modification, so immediate changes to the
     * slice will affect the result of future reads.
     * @param options Defaults to `{ copy: true }`
     */
    bytes(options?: { copy?: boolean }): Uint8Array;
    /** Returns whether the unread portion of the buffer is empty. */
    empty(): boolean;
    /** A read only number of bytes of the unread portion of the buffer. */
    readonly length: number;
    /** The read only capacity of the buffer's underlying byte slice, that is,
     * the total space allocated for the buffer's data. */
    readonly capacity: number;
    /** Discards all but the first `n` unread bytes from the buffer but
     * continues to use the same allocated storage. It throws if `n` is
     * negative or greater than the length of the buffer. */
    truncate(n: number): void;
    /** Resets the buffer to be empty, but it retains the underlying storage for
     * use by future writes. `.reset()` is the same as `.truncate(0)`. */
    reset(): void;
    /** Reads the next `p.length` bytes from the buffer or until the buffer is
     * drained. Returns the number of bytes read. If the buffer has no data to
     * return, the return is EOF (`null`). */
    readSync(p: Uint8Array): number | null;
    /** Reads the next `p.length` bytes from the buffer or until the buffer is
     * drained. Resolves to the number of bytes read. If the buffer has no
     * data to return, resolves to EOF (`null`).
     *
     * NOTE: This methods reads bytes synchronously; it's provided for
     * compatibility with `Reader` interfaces.
     */
    read(p: Uint8Array): Promise<number | null>;
    writeSync(p: Uint8Array): number;
    /** NOTE: This methods writes bytes synchronously; it's provided for
     * compatibility with `Writer` interface. */
    write(p: Uint8Array): Promise<number>;
    /** Grows the buffer's capacity, if necessary, to guarantee space for
     * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
     * the buffer without another allocation. If `n` is negative, `.grow()` will
     * throw. If the buffer can't grow it will throw an error.
     *
     * Based on Go Lang's
     * [Buffer.Grow](https://golang.org/pkg/bytes/#Buffer.Grow). */
    grow(n: number): void;
    /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
     * growing the buffer as needed. It resolves to the number of bytes read.
     * If the buffer becomes too large, `.readFrom()` will reject with an error.
     *
     * Based on Go Lang's
     * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */
    readFrom(r: Reader): Promise<number>;
    /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
     * growing the buffer as needed. It returns the number of bytes read. If the
     * buffer becomes too large, `.readFromSync()` will throw an error.
     *
     * Based on Go Lang's
     * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */
    readFromSync(r: ReaderSync): number;
  }

  /** Read Reader `r` until EOF (`null`) and resolve to the content as
   * Uint8Array`.
   *
   * ```ts
   * // Example from stdin
   * const stdinContent = await Deno.readAll(Deno.stdin);
   *
   * // Example from file
   * const file = await Deno.open("my_file.txt", {read: true});
   * const myFileContent = await Deno.readAll(file);
   * Deno.close(file.rid);
   *
   * // Example from buffer
   * const myData = new Uint8Array(100);
   * // ... fill myData array with data
   * const reader = new Deno.Buffer(myData.buffer as ArrayBuffer);
   * const bufferContent = await Deno.readAll(reader);
   * ```
   */
  export function readAll(r: Reader): Promise<Uint8Array>;

  /** Synchronously reads Reader `r` until EOF (`null`) and returns the content
   * as `Uint8Array`.
   *
   * ```ts
   * // Example from stdin
   * const stdinContent = Deno.readAllSync(Deno.stdin);
   *
   * // Example from file
   * const file = Deno.openSync("my_file.txt", {read: true});
   * const myFileContent = Deno.readAllSync(file);
   * Deno.close(file.rid);
   *
   * // Example from buffer
   * const myData = new Uint8Array(100);
   * // ... fill myData array with data
   * const reader = new Deno.Buffer(myData.buffer as ArrayBuffer);
   * const bufferContent = Deno.readAllSync(reader);
   * ```
   */
  export function readAllSync(r: ReaderSync): Uint8Array;

  /** Write all the content of the array buffer (`arr`) to the writer (`w`).
   *
   * ```ts
   * // Example writing to stdout
   * const contentBytes = new TextEncoder().encode("Hello World");
   * await Deno.writeAll(Deno.stdout, contentBytes);
   *
   * // Example writing to file
   * const contentBytes = new TextEncoder().encode("Hello World");
   * const file = await Deno.open('test.file', {write: true});
   * await Deno.writeAll(file, contentBytes);
   * Deno.close(file.rid);
   *
   * // Example writing to buffer
   * const contentBytes = new TextEncoder().encode("Hello World");
   * const writer = new Deno.Buffer();
   * await Deno.writeAll(writer, contentBytes);
   * console.log(writer.bytes().length);  // 11
   * ```
   */
  export function writeAll(w: Writer, arr: Uint8Array): Promise<void>;

  /** Synchronously write all the content of the array buffer (`arr`) to the
   * writer (`w`).
   *
   * ```ts
   * // Example writing to stdout
   * const contentBytes = new TextEncoder().encode("Hello World");
   * Deno.writeAllSync(Deno.stdout, contentBytes);
   *
   * // Example writing to file
   * const contentBytes = new TextEncoder().encode("Hello World");
   * const file = Deno.openSync('test.file', {write: true});
   * Deno.writeAllSync(file, contentBytes);
   * Deno.close(file.rid);
   *
   * // Example writing to buffer
   * const contentBytes = new TextEncoder().encode("Hello World");
   * const writer = new Deno.Buffer();
   * Deno.writeAllSync(writer, contentBytes);
   * console.log(writer.bytes().length);  // 11
   * ```
   */
  export function writeAllSync(w: WriterSync, arr: Uint8Array): void;

  export interface MkdirOptions {
    /** Defaults to `false`. If set to `true`, means that any intermediate
     * directories will also be created (as with the shell command `mkdir -p`).
     * Intermediate directories are created with the same permissions.
     * When recursive is set to `true`, succeeds silently (without changing any
     * permissions) if a directory already exists at the path, or if the path
     * is a symlink to an existing directory. */
    recursive?: boolean;
    /** Permissions to use when creating the directory (defaults to `0o777`,
     * before the process's umask).
     * Ignored on Windows. */
    mode?: number;
  }

  /** Synchronously creates a new directory with the specified path.
   *
   * ```ts
   * Deno.mkdirSync("new_dir");
   * Deno.mkdirSync("nested/directories", { recursive: true });
   * Deno.mkdirSync("restricted_access_dir", { mode: 0o700 });
   * ```
   *
   * Defaults to throwing error if the directory already exists.
   *
   * Requires `allow-write` permission. */
  export function mkdirSync(path: string | URL, options?: MkdirOptions): void;

  /** Creates a new directory with the specified path.
   *
   * ```ts
   * await Deno.mkdir("new_dir");
   * await Deno.mkdir("nested/directories", { recursive: true });
   * await Deno.mkdir("restricted_access_dir", { mode: 0o700 });
   * ```
   *
   * Defaults to throwing error if the directory already exists.
   *
   * Requires `allow-write` permission. */
  export function mkdir(
    path: string | URL,
    options?: MkdirOptions,
  ): Promise<void>;

  export interface MakeTempOptions {
    /** Directory where the temporary directory should be created (defaults to
     * the env variable TMPDIR, or the system's default, usually /tmp).
     *
     * Note that if the passed `dir` is relative, the path returned by
     * makeTempFile() and makeTempDir() will also be relative. Be mindful of
     * this when changing working directory. */
    dir?: string;
    /** String that should precede the random portion of the temporary
     * directory's name. */
    prefix?: string;
    /** String that should follow the random portion of the temporary
     * directory's name. */
    suffix?: string;
  }

  /** Synchronously creates a new temporary directory in the default directory
   * for temporary files, unless `dir` is specified. Other optional options
   * include prefixing and suffixing the directory name with `prefix` and
   * `suffix` respectively.
   *
   * The full path to the newly created directory is returned.
   *
   * Multiple programs calling this function simultaneously will create different
   * directories. It is the caller's responsibility to remove the directory when
   * no longer needed.
   *
   * ```ts
   * const tempDirName0 = Deno.makeTempDirSync();  // e.g. /tmp/2894ea76
   * const tempDirName1 = Deno.makeTempDirSync({ prefix: 'my_temp' });  // e.g. /tmp/my_temp339c944d
   * ```
   *
   * Requires `allow-write` permission. */
  // TODO(ry) Doesn't check permissions.
  export function makeTempDirSync(options?: MakeTempOptions): string;

  /** Creates a new temporary directory in the default directory for temporary
   * files, unless `dir` is specified. Other optional options include
   * prefixing and suffixing the directory name with `prefix` and `suffix`
   * respectively.
   *
   * This call resolves to the full path to the newly created directory.
   *
   * Multiple programs calling this function simultaneously will create different
   * directories. It is the caller's responsibility to remove the directory when
   * no longer needed.
   *
   * ```ts
   * const tempDirName0 = await Deno.makeTempDir();  // e.g. /tmp/2894ea76
   * const tempDirName1 = await Deno.makeTempDir({ prefix: 'my_temp' }); // e.g. /tmp/my_temp339c944d
   * ```
   *
   * Requires `allow-write` permission. */
  // TODO(ry) Doesn't check permissions.
  export function makeTempDir(options?: MakeTempOptions): Promise<string>;

  /** Synchronously creates a new temporary file in the default directory for
   * temporary files, unless `dir` is specified.
   * Other optional options include prefixing and suffixing the directory name
   * with `prefix` and `suffix` respectively.
   *
   * The full path to the newly created file is returned.
   *
   * Multiple programs calling this function simultaneously will create different
   * files. It is the caller's responsibility to remove the file when no longer
   * needed.
   *
   * ```ts
   * const tempFileName0 = Deno.makeTempFileSync(); // e.g. /tmp/419e0bf2
   * const tempFileName1 = Deno.makeTempFileSync({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
   * ```
   *
   * Requires `allow-write` permission. */
  export function makeTempFileSync(options?: MakeTempOptions): string;

  /** Creates a new temporary file in the default directory for temporary
   * files, unless `dir` is specified.  Other
   * optional options include prefixing and suffixing the directory name with
   * `prefix` and `suffix` respectively.
   *
   * This call resolves to the full path to the newly created file.
   *
   * Multiple programs calling this function simultaneously will create different
   * files. It is the caller's responsibility to remove the file when no longer
   * needed.
   *
   * ```ts
   * const tmpFileName0 = await Deno.makeTempFile();  // e.g. /tmp/419e0bf2
   * const tmpFileName1 = await Deno.makeTempFile({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
   * ```
   *
   * Requires `allow-write` permission. */
  export function makeTempFile(options?: MakeTempOptions): Promise<string>;

  /** Synchronously changes the permission of a specific file/directory of
   * specified path.  Ignores the process's umask.
   *
   * ```ts
   * Deno.chmodSync("/path/to/file", 0o666);
   * ```
   *
   * For a full description, see [chmod](#Deno.chmod)
   *
   * NOTE: This API currently throws on Windows
   *
   * Requires `allow-write` permission. */
  export function chmodSync(path: string | URL, mode: number): void;

  /** Changes the permission of a specific file/directory of specified path.
   * Ignores the process's umask.
   *
   * ```ts
   * await Deno.chmod("/path/to/file", 0o666);
   * ```
   *
   * The mode is a sequence of 3 octal numbers.  The first/left-most number
   * specifies the permissions for the owner.  The second number specifies the
   * permissions for the group. The last/right-most number specifies the
   * permissions for others.  For example, with a mode of 0o764, the owner (7) can
   * read/write/execute, the group (6) can read/write and everyone else (4) can
   * read only.
   *
   * | Number | Description |
   * | ------ | ----------- |
   * | 7      | read, write, and execute |
   * | 6      | read and write |
   * | 5      | read and execute |
   * | 4      | read only |
   * | 3      | write and execute |
   * | 2      | write only |
   * | 1      | execute only |
   * | 0      | no permission |
   *
   * NOTE: This API currently throws on Windows
   *
   * Requires `allow-write` permission. */
  export function chmod(path: string | URL, mode: number): Promise<void>;

  /** Synchronously change owner of a regular file or directory. This functionality
   * is not available on Windows.
   *
   * ```ts
   * Deno.chownSync("myFile.txt", 1000, 1002);
   * ```
   *
   * Requires `allow-write` permission.
   *
   * Throws Error (not implemented) if executed on Windows
   *
   * @param path path to the file
   * @param uid user id (UID) of the new owner, or `null` for no change
   * @param gid group id (GID) of the new owner, or `null` for no change
   */
  export function chownSync(
    path: string | URL,
    uid: number | null,
    gid: number | null,
  ): void;

  /** Change owner of a regular file or directory. This functionality
   * is not available on Windows.
   *
   * ```ts
   * await Deno.chown("myFile.txt", 1000, 1002);
   * ```
   *
   * Requires `allow-write` permission.
   *
   * Throws Error (not implemented) if executed on Windows
   *
   * @param path path to the file
   * @param uid user id (UID) of the new owner, or `null` for no change
   * @param gid group id (GID) of the new owner, or `null` for no change
   */
  export function chown(
    path: string | URL,
    uid: number | null,
    gid: number | null,
  ): Promise<void>;

  export interface RemoveOptions {
    /** Defaults to `false`. If set to `true`, path will be removed even if
     * it's a non-empty directory. */
    recursive?: boolean;
  }

  /** Synchronously removes the named file or directory.
   *
   * ```ts
   * Deno.removeSync("/path/to/empty_dir/or/file");
   * Deno.removeSync("/path/to/populated_dir/or/file", { recursive: true });
   * ```
   *
   * Throws error if permission denied, path not found, or path is a non-empty
   * directory and the `recursive` option isn't set to `true`.
   *
   * Requires `allow-write` permission. */
  export function removeSync(path: string | URL, options?: RemoveOptions): void;

  /** Removes the named file or directory.
   *
   * ```ts
   * await Deno.remove("/path/to/empty_dir/or/file");
   * await Deno.remove("/path/to/populated_dir/or/file", { recursive: true });
   * ```
   *
   * Throws error if permission denied, path not found, or path is a non-empty
   * directory and the `recursive` option isn't set to `true`.
   *
   * Requires `allow-write` permission. */
  export function remove(
    path: string | URL,
    options?: RemoveOptions,
  ): Promise<void>;

  /** Synchronously renames (moves) `oldpath` to `newpath`. Paths may be files or
   * directories.  If `newpath` already exists and is not a directory,
   * `renameSync()` replaces it. OS-specific restrictions may apply when
   * `oldpath` and `newpath` are in different directories.
   *
   * ```ts
   * Deno.renameSync("old/path", "new/path");
   * ```
   *
   * On Unix, this operation does not follow symlinks at either path.
   *
   * It varies between platforms when the operation throws errors, and if so what
   * they are. It's always an error to rename anything to a non-empty directory.
   *
   * Requires `allow-read` and `allow-write` permissions. */
  export function renameSync(oldpath: string, newpath: string): void;

  /** Renames (moves) `oldpath` to `newpath`.  Paths may be files or directories.
   * If `newpath` already exists and is not a directory, `rename()` replaces it.
   * OS-specific restrictions may apply when `oldpath` and `newpath` are in
   * different directories.
   *
   * ```ts
   * await Deno.rename("old/path", "new/path");
   * ```
   *
   * On Unix, this operation does not follow symlinks at either path.
   *
   * It varies between platforms when the operation throws errors, and if so what
   * they are. It's always an error to rename anything to a non-empty directory.
   *
   * Requires `allow-read` and `allow-write` permission. */
  export function rename(oldpath: string, newpath: string): Promise<void>;

  /** Synchronously reads and returns the entire contents of a file as utf8
   *  encoded string. Reading a directory throws an error.
   *
   * ```ts
   * const data = Deno.readTextFileSync("hello.txt");
   * console.log(data);
   * ```
   *
   * Requires `allow-read` permission. */
  export function readTextFileSync(path: string | URL): string;

  /** Asynchronously reads and returns the entire contents of a file as utf8
   *  encoded string. Reading a directory throws an error.
   *
   * ```ts
   * const data = await Deno.readTextFile("hello.txt");
   * console.log(data);
   * ```
   *
   * Requires `allow-read` permission. */
  export function readTextFile(path: string | URL): Promise<string>;

  /** Synchronously reads and returns the entire contents of a file as an array
   * of bytes. `TextDecoder` can be used to transform the bytes to string if
   * required.  Reading a directory returns an empty data array.
   *
   * ```ts
   * const decoder = new TextDecoder("utf-8");
   * const data = Deno.readFileSync("hello.txt");
   * console.log(decoder.decode(data));
   * ```
   *
   * Requires `allow-read` permission. */
  export function readFileSync(path: string | URL): Uint8Array;

  /** Reads and resolves to the entire contents of a file as an array of bytes.
   * `TextDecoder` can be used to transform the bytes to string if required.
   * Reading a directory returns an empty data array.
   *
   * ```ts
   * const decoder = new TextDecoder("utf-8");
   * const data = await Deno.readFile("hello.txt");
   * console.log(decoder.decode(data));
   * ```
   *
   * Requires `allow-read` permission. */
  export function readFile(path: string | URL): Promise<Uint8Array>;

  /** A FileInfo describes a file and is returned by `stat`, `lstat`,
   * `statSync`, `lstatSync`. */
  export interface FileInfo {
    /** True if this is info for a regular file. Mutually exclusive to
     * `FileInfo.isDirectory` and `FileInfo.isSymlink`. */
    isFile: boolean;
    /** True if this is info for a regular directory. Mutually exclusive to
     * `FileInfo.isFile` and `FileInfo.isSymlink`. */
    isDirectory: boolean;
    /** True if this is info for a symlink. Mutually exclusive to
     * `FileInfo.isFile` and `FileInfo.isDirectory`. */
    isSymlink: boolean;
    /** The size of the file, in bytes. */
    size: number;
    /** The last modification time of the file. This corresponds to the `mtime`
     * field from `stat` on Linux/Mac OS and `ftLastWriteTime` on Windows. This
     * may not be available on all platforms. */
    mtime: Date | null;
    /** The last access time of the file. This corresponds to the `atime`
     * field from `stat` on Unix and `ftLastAccessTime` on Windows. This may not
     * be available on all platforms. */
    atime: Date | null;
    /** The creation time of the file. This corresponds to the `birthtime`
     * field from `stat` on Mac/BSD and `ftCreationTime` on Windows. This may
     * not be available on all platforms. */
    birthtime: Date | null;
    /** ID of the device containing the file.
     *
     * _Linux/Mac OS only._ */
    dev: number | null;
    /** Inode number.
     *
     * _Linux/Mac OS only._ */
    ino: number | null;
    /** **UNSTABLE**: Match behavior with Go on Windows for `mode`.
     *
     * The underlying raw `st_mode` bits that contain the standard Unix
     * permissions for this file/directory. */
    mode: number | null;
    /** Number of hard links pointing to this file.
     *
     * _Linux/Mac OS only._ */
    nlink: number | null;
    /** User ID of the owner of this file.
     *
     * _Linux/Mac OS only._ */
    uid: number | null;
    /** Group ID of the owner of this file.
     *
     * _Linux/Mac OS only._ */
    gid: number | null;
    /** Device ID of this file.
     *
     * _Linux/Mac OS only._ */
    rdev: number | null;
    /** Blocksize for filesystem I/O.
     *
     * _Linux/Mac OS only._ */
    blksize: number | null;
    /** Number of blocks allocated to the file, in 512-byte units.
     *
     * _Linux/Mac OS only._ */
    blocks: number | null;
  }

  /** Returns absolute normalized path, with symbolic links resolved.
   *
   * ```ts
   * // e.g. given /home/alice/file.txt and current directory /home/alice
   * Deno.symlinkSync("file.txt", "symlink_file.txt");
   * const realPath = Deno.realPathSync("./file.txt");
   * const realSymLinkPath = Deno.realPathSync("./symlink_file.txt");
   * console.log(realPath);  // outputs "/home/alice/file.txt"
   * console.log(realSymLinkPath);  // outputs "/home/alice/file.txt"
   * ```
   *
   * Requires `allow-read` permission for the target path.
   * Also requires `allow-read` permission for the CWD if the target path is
   * relative.*/
  export function realPathSync(path: string): string;

  /** Resolves to the absolute normalized path, with symbolic links resolved.
   *
   * ```ts
   * // e.g. given /home/alice/file.txt and current directory /home/alice
   * await Deno.symlink("file.txt", "symlink_file.txt");
   * const realPath = await Deno.realPath("./file.txt");
   * const realSymLinkPath = await Deno.realPath("./symlink_file.txt");
   * console.log(realPath);  // outputs "/home/alice/file.txt"
   * console.log(realSymLinkPath);  // outputs "/home/alice/file.txt"
   * ```
   *
   * Requires `allow-read` permission for the target path.
   * Also requires `allow-read` permission for the CWD if the target path is
   * relative.*/
  export function realPath(path: string): Promise<string>;

  export interface DirEntry {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
  }

  /** Synchronously reads the directory given by `path` and returns an iterable
   * of `Deno.DirEntry`.
   *
   * ```ts
   * for (const dirEntry of Deno.readDirSync("/")) {
   *   console.log(dirEntry.name);
   * }
   * ```
   *
   * Throws error if `path` is not a directory.
   *
   * Requires `allow-read` permission. */
  export function readDirSync(path: string | URL): Iterable<DirEntry>;

  /** Reads the directory given by `path` and returns an async iterable of
   * `Deno.DirEntry`.
   *
   * ```ts
   * for await (const dirEntry of Deno.readDir("/")) {
   *   console.log(dirEntry.name);
   * }
   * ```
   *
   * Throws error if `path` is not a directory.
   *
   * Requires `allow-read` permission. */
  export function readDir(path: string | URL): AsyncIterable<DirEntry>;

  /** Synchronously copies the contents and permissions of one file to another
   * specified path, by default creating a new file if needed, else overwriting.
   * Fails if target path is a directory or is unwritable.
   *
   * ```ts
   * Deno.copyFileSync("from.txt", "to.txt");
   * ```
   *
   * Requires `allow-read` permission on fromPath.
   * Requires `allow-write` permission on toPath. */
  export function copyFileSync(
    fromPath: string | URL,
    toPath: string | URL,
  ): void;

  /** Copies the contents and permissions of one file to another specified path,
   * by default creating a new file if needed, else overwriting. Fails if target
   * path is a directory or is unwritable.
   *
   * ```ts
   * await Deno.copyFile("from.txt", "to.txt");
   * ```
   *
   * Requires `allow-read` permission on fromPath.
   * Requires `allow-write` permission on toPath. */
  export function copyFile(
    fromPath: string | URL,
    toPath: string | URL,
  ): Promise<void>;

  /** Returns the full path destination of the named symbolic link.
   *
   * ```ts
   * Deno.symlinkSync("./test.txt", "./test_link.txt");
   * const target = Deno.readLinkSync("./test_link.txt"); // full path of ./test.txt
   * ```
   *
   * Throws TypeError if called with a hard link
   *
   * Requires `allow-read` permission. */
  export function readLinkSync(path: string | URL): string;

  /** Resolves to the full path destination of the named symbolic link.
   *
   * ```ts
   * await Deno.symlink("./test.txt", "./test_link.txt");
   * const target = await Deno.readLink("./test_link.txt"); // full path of ./test.txt
   * ```
   *
   * Throws TypeError if called with a hard link
   *
   * Requires `allow-read` permission. */
  export function readLink(path: string | URL): Promise<string>;

  /** Resolves to a `Deno.FileInfo` for the specified `path`. If `path` is a
   * symlink, information for the symlink will be returned instead of what it
   * points to.
   *
   * ```ts
   * import { assert } from "https://deno.land/std/testing/asserts.ts";
   * const fileInfo = await Deno.lstat("hello.txt");
   * assert(fileInfo.isFile);
   * ```
   *
   * Requires `allow-read` permission. */
  export function lstat(path: string | URL): Promise<FileInfo>;

  /** Synchronously returns a `Deno.FileInfo` for the specified `path`. If
   * `path` is a symlink, information for the symlink will be returned instead of
   * what it points to..
   *
   * ```ts
   * const fileInfo = Deno.lstatSync("hello.txt");
   * assert(fileInfo.isFile);
   * ```
   *
   * Requires `allow-read` permission. */
  export function lstatSync(path: string | URL): FileInfo;

  /** Resolves to a `Deno.FileInfo` for the specified `path`. Will always
   * follow symlinks.
   *
   * ```ts
   * import { assert } from "https://deno.land/std/testing/asserts.ts";
   * const fileInfo = await Deno.stat("hello.txt");
   * assert(fileInfo.isFile);
   * ```
   *
   * Requires `allow-read` permission. */
  export function stat(path: string | URL): Promise<FileInfo>;

  /** Synchronously returns a `Deno.FileInfo` for the specified `path`. Will
   * always follow symlinks.
   *
   * ```ts
   * import { assert } from "https://deno.land/std/testing/asserts.ts";
   * const fileInfo = Deno.statSync("hello.txt");
   * assert(fileInfo.isFile);
   * ```
   *
   * Requires `allow-read` permission. */
  export function statSync(path: string | URL): FileInfo;

  /** Options for writing to a file. */
  export interface WriteFileOptions {
    /** Defaults to `false`. If set to `true`, will append to a file instead of
     * overwriting previous contents. */
    append?: boolean;
    /** Sets the option to allow creating a new file, if one doesn't already
     * exist at the specified path (defaults to `true`). */
    create?: boolean;
    /** Permissions always applied to file. */
    mode?: number;
  }

  /** Synchronously write `data` to the given `path`, by default creating a new
   * file if needed, else overwriting.
   *
   * ```ts
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world\n");
   * Deno.writeFileSync("hello1.txt", data);  // overwrite "hello1.txt" or create it
   * Deno.writeFileSync("hello2.txt", data, {create: false});  // only works if "hello2.txt" exists
   * Deno.writeFileSync("hello3.txt", data, {mode: 0o777});  // set permissions on new file
   * Deno.writeFileSync("hello4.txt", data, {append: true});  // add data to the end of the file
   * ```
   *
   * Requires `allow-write` permission, and `allow-read` if `options.create` is
   * `false`.
   */
  export function writeFileSync(
    path: string | URL,
    data: Uint8Array,
    options?: WriteFileOptions,
  ): void;

  /** Write `data` to the given `path`, by default creating a new file if needed,
   * else overwriting.
   *
   * ```ts
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world\n");
   * await Deno.writeFile("hello1.txt", data);  // overwrite "hello1.txt" or create it
   * await Deno.writeFile("hello2.txt", data, {create: false});  // only works if "hello2.txt" exists
   * await Deno.writeFile("hello3.txt", data, {mode: 0o777});  // set permissions on new file
   * await Deno.writeFile("hello4.txt", data, {append: true});  // add data to the end of the file
   * ```
   *
   * Requires `allow-write` permission, and `allow-read` if `options.create` is `false`.
   */
  export function writeFile(
    path: string | URL,
    data: Uint8Array,
    options?: WriteFileOptions,
  ): Promise<void>;

  /** Synchronously write string `data` to the given `path`, by default creating a new file if needed,
   * else overwriting.
   *
   * ```ts
   * Deno.writeTextFileSync("hello1.txt", "Hello world\n");  // overwrite "hello1.txt" or create it
   * ```
   *
   * Requires `allow-write` permission, and `allow-read` if `options.create` is `false`.
   */
  export function writeTextFileSync(
    path: string | URL,
    data: string,
    options?: WriteFileOptions,
  ): void;

  /** Asynchronously write string `data` to the given `path`, by default creating a new file if needed,
   * else overwriting.
   *
   * ```ts
   * await Deno.writeTextFile("hello1.txt", "Hello world\n");  // overwrite "hello1.txt" or create it
   * ```
   *
   * Requires `allow-write` permission, and `allow-read` if `options.create` is `false`.
   */
  export function writeTextFile(
    path: string | URL,
    data: string,
    options?: WriteFileOptions,
  ): Promise<void>;

  /** Synchronously truncates or extends the specified file, to reach the
   * specified `len`.  If `len` is not specified then the entire file contents
   * are truncated.
   *
   * ```ts
   * // truncate the entire file
   * Deno.truncateSync("my_file.txt");
   *
   * // truncate part of the file
   * const file = Deno.makeTempFileSync();
   * Deno.writeFileSync(file, new TextEncoder().encode("Hello World"));
   * Deno.truncateSync(file, 7);
   * const data = Deno.readFileSync(file);
   * console.log(new TextDecoder().decode(data));
   * ```
   *
   * Requires `allow-write` permission. */
  export function truncateSync(name: string, len?: number): void;

  /** Truncates or extends the specified file, to reach the specified `len`. If
   * `len` is not specified then the entire file contents are truncated.
   *
   * ```ts
   * // truncate the entire file
   * await Deno.truncate("my_file.txt");
   *
   * // truncate part of the file
   * const file = await Deno.makeTempFile();
   * await Deno.writeFile(file, new TextEncoder().encode("Hello World"));
   * await Deno.truncate(file, 7);
   * const data = await Deno.readFile(file);
   * console.log(new TextDecoder().decode(data));  // "Hello W"
   * ```
   *
   * Requires `allow-write` permission. */
  export function truncate(name: string, len?: number): Promise<void>;

  export interface NetAddr {
    transport: "tcp" | "udp";
    hostname: string;
    port: number;
  }

  export interface UnixAddr {
    transport: "unix" | "unixpacket";
    path: string;
  }

  export type Addr = NetAddr | UnixAddr;

  /** A generic network listener for stream-oriented protocols. */
  export interface Listener extends AsyncIterable<Conn> {
    /** Waits for and resolves to the next connection to the `Listener`. */
    accept(): Promise<Conn>;
    /** Close closes the listener. Any pending accept promises will be rejected
     * with errors. */
    close(): void;
    /** Return the address of the `Listener`. */
    readonly addr: Addr;

    /** Return the rid of the `Listener`. */
    readonly rid: number;

    [Symbol.asyncIterator](): AsyncIterableIterator<Conn>;
  }

  export interface Conn extends Reader, Writer, Closer {
    /** The local address of the connection. */
    readonly localAddr: Addr;
    /** The remote address of the connection. */
    readonly remoteAddr: Addr;
    /** The resource ID of the connection. */
    readonly rid: number;
    /** Shuts down (`shutdown(2)`) the writing side of the TCP connection. Most
     * callers should just use `close()`. */
    closeWrite(): void;
  }

  export interface ListenOptions {
    /** The port to listen on. */
    port: number;
    /** A literal IP address or host name that can be resolved to an IP address.
     * If not specified, defaults to `0.0.0.0`. */
    hostname?: string;
  }

  /** Listen announces on the local transport address.
   *
   * ```ts
   * const listener1 = Deno.listen({ port: 80 })
   * const listener2 = Deno.listen({ hostname: "192.0.2.1", port: 80 })
   * const listener3 = Deno.listen({ hostname: "[2001:db8::1]", port: 80 });
   * const listener4 = Deno.listen({ hostname: "golang.org", port: 80, transport: "tcp" });
   * ```
   *
   * Requires `allow-net` permission. */
  export function listen(
    options: ListenOptions & { transport?: "tcp" },
  ): Listener;

  export interface ListenTlsOptions extends ListenOptions {
    /** Server certificate file. */
    certFile: string;
    /** Server public key file. */
    keyFile: string;

    transport?: "tcp";
  }

  /** Listen announces on the local transport address over TLS (transport layer
   * security).
   *
   * ```ts
   * const lstnr = Deno.listenTls({ port: 443, certFile: "./server.crt", keyFile: "./server.key" });
   * ```
   *
   * Requires `allow-net` permission. */
  export function listenTls(options: ListenTlsOptions): Listener;

  export interface ConnectOptions {
    /** The port to connect to. */
    port: number;
    /** A literal IP address or host name that can be resolved to an IP address.
     * If not specified, defaults to `127.0.0.1`. */
    hostname?: string;
    transport?: "tcp";
  }

  /**
   * Connects to the hostname (default is "127.0.0.1") and port on the named
   * transport (default is "tcp"), and resolves to the connection (`Conn`).
   *
   * ```ts
   * const conn1 = await Deno.connect({ port: 80 });
   * const conn2 = await Deno.connect({ hostname: "192.0.2.1", port: 80 });
   * const conn3 = await Deno.connect({ hostname: "[2001:db8::1]", port: 80 });
   * const conn4 = await Deno.connect({ hostname: "golang.org", port: 80, transport: "tcp" });
   * ```
   *
   * Requires `allow-net` permission for "tcp". */
  export function connect(options: ConnectOptions): Promise<Conn>;

  export interface ConnectTlsOptions {
    /** The port to connect to. */
    port: number;
    /** A literal IP address or host name that can be resolved to an IP address.
     * If not specified, defaults to `127.0.0.1`. */
    hostname?: string;
    /** Server certificate file. */
    certFile?: string;
  }

  /** Establishes a secure connection over TLS (transport layer security) using
   * an optional cert file, hostname (default is "127.0.0.1") and port.  The
   * cert file is optional and if not included Mozilla's root certificates will
   * be used (see also https://github.com/ctz/webpki-roots for specifics)
   *
   * ```ts
   * const conn1 = await Deno.connectTls({ port: 80 });
   * const conn2 = await Deno.connectTls({ certFile: "./certs/my_custom_root_CA.pem", hostname: "192.0.2.1", port: 80 });
   * const conn3 = await Deno.connectTls({ hostname: "[2001:db8::1]", port: 80 });
   * const conn4 = await Deno.connectTls({ certFile: "./certs/my_custom_root_CA.pem", hostname: "golang.org", port: 80});
   * ```
   *
   * Requires `allow-net` permission.
   */
  export function connectTls(options: ConnectTlsOptions): Promise<Conn>;

  /** Shutdown socket send operations.
   *
   * Matches behavior of POSIX shutdown(3).
   *
   * ```ts
   * const listener = Deno.listen({ port: 80 });
   * const conn = await listener.accept();
   * Deno.shutdown(conn.rid);
   * ```
   */
  export function shutdown(rid: number): Promise<void>;

  export interface Metrics {
    opsDispatched: number;
    opsDispatchedSync: number;
    opsDispatchedAsync: number;
    opsDispatchedAsyncUnref: number;
    opsCompleted: number;
    opsCompletedSync: number;
    opsCompletedAsync: number;
    opsCompletedAsyncUnref: number;
    bytesSentControl: number;
    bytesSentData: number;
    bytesReceived: number;
  }

  /** Receive metrics from the privileged side of Deno. This is primarily used
   * in the development of Deno. 'Ops', also called 'bindings', are the go-between
   * between Deno JavaScript and Deno Rust.
   *
   *      > console.table(Deno.metrics())
   *      ┌─────────────────────────┬────────┐
   *      │         (index)         │ Values │
   *      ├─────────────────────────┼────────┤
   *      │      opsDispatched      │   3    │
   *      │    opsDispatchedSync    │   2    │
   *      │   opsDispatchedAsync    │   1    │
   *      │ opsDispatchedAsyncUnref │   0    │
   *      │      opsCompleted       │   3    │
   *      │    opsCompletedSync     │   2    │
   *      │    opsCompletedAsync    │   1    │
   *      │ opsCompletedAsyncUnref  │   0    │
   *      │    bytesSentControl     │   73   │
   *      │      bytesSentData      │   0    │
   *      │      bytesReceived      │  375   │
   *      └─────────────────────────┴────────┘
   */
  export function metrics(): Metrics;

  interface ResourceMap {
    // deno-lint-ignore no-explicit-any
    [rid: number]: any;
  }

  /** Returns a map of open resource ids (rid) along with their string
   * representations. This is an internal API and as such resource
   * representation has `any` type; that means it can change any time.
   *
   * ```ts
   * console.log(Deno.resources());
   * // { 0: "stdin", 1: "stdout", 2: "stderr" }
   * Deno.openSync('../test.file');
   * console.log(Deno.resources());
   * // { 0: "stdin", 1: "stdout", 2: "stderr", 3: "fsFile" }
   * ```
   */
  export function resources(): ResourceMap;

  export interface FsEvent {
    kind: "any" | "access" | "create" | "modify" | "remove";
    paths: string[];
  }

  /** Watch for file system events against one or more `paths`, which can be files
   * or directories.  These paths must exist already.  One user action (e.g.
   * `touch test.file`) can  generate multiple file system events.  Likewise,
   * one user action can result in multiple file paths in one event (e.g. `mv
   * old_name.txt new_name.txt`).  Recursive option is `true` by default and,
   * for directories, will watch the specified directory and all sub directories.
   * Note that the exact ordering of the events can vary between operating systems.
   *
   * ```ts
   * const watcher = Deno.watchFs("/");
   * for await (const event of watcher) {
   *    console.log(">>>> event", event);
   *    // { kind: "create", paths: [ "/foo.txt" ] }
   * }
   *```
   *
   * Requires `allow-read` permission.
   */
  export function watchFs(
    paths: string | string[],
    options?: { recursive: boolean },
  ): AsyncIterableIterator<FsEvent>;

  export class Process<T extends RunOptions = RunOptions> {
    readonly rid: number;
    readonly pid: number;
    readonly stdin: T["stdin"] extends "piped" ? Writer & Closer
      : (Writer & Closer) | null;
    readonly stdout: T["stdout"] extends "piped" ? Reader & Closer
      : (Reader & Closer) | null;
    readonly stderr: T["stderr"] extends "piped" ? Reader & Closer
      : (Reader & Closer) | null;
    /** Resolves to the current status of the process. */
    status(): Promise<ProcessStatus>;
    /** Buffer the stdout until EOF and return it as `Uint8Array`.
     *
     * You must set stdout to `"piped"` when creating the process.
     *
     * This calls `close()` on stdout after its done. */
    output(): Promise<Uint8Array>;
    /** Buffer the stderr until EOF and return it as `Uint8Array`.
     *
     * You must set stderr to `"piped"` when creating the process.
     *
     * This calls `close()` on stderr after its done. */
    stderrOutput(): Promise<Uint8Array>;
    close(): void;

    /** **UNSTABLE**: The `signo` argument may change to require the Deno.Signal
     * enum.
     *
     * Send a signal to process. This functionality currently only works on
     * Linux and Mac OS.
     */
    kill(signo: number): void;
  }

  export type ProcessStatus =
    | {
      success: true;
      code: 0;
      signal?: undefined;
    }
    | {
      success: false;
      code: number;
      signal?: number;
    };

  export interface RunOptions {
    /** Arguments to pass. Note, the first element needs to be a path to the
     * binary */
    cmd: string[] | [URL, ...string[]];
    cwd?: string;
    env?: {
      [key: string]: string;
    };
    stdout?: "inherit" | "piped" | "null" | number;
    stderr?: "inherit" | "piped" | "null" | number;
    stdin?: "inherit" | "piped" | "null" | number;
  }

  /** Spawns new subprocess.  RunOptions must contain at a minimum the `opt.cmd`,
   * an array of program arguments, the first of which is the binary.
   *
   * ```ts
   * const p = Deno.run({
   *   cmd: ["echo", "hello"],
   * });
   * ```
   *
   * Subprocess uses same working directory as parent process unless `opt.cwd`
   * is specified.
   *
   * Environmental variables for subprocess can be specified using `opt.env`
   * mapping.
   *
   * By default subprocess inherits stdio of parent process. To change that
   * `opt.stdout`, `opt.stderr` and `opt.stdin` can be specified independently -
   * they can be set to either an rid of open file or set to "inherit" "piped"
   * or "null":
   *
   * `"inherit"` The default if unspecified. The child inherits from the
   * corresponding parent descriptor.
   *
   * `"piped"` A new pipe should be arranged to connect the parent and child
   * sub-processes.
   *
   * `"null"` This stream will be ignored. This is the equivalent of attaching
   * the stream to `/dev/null`.
   *
   * Details of the spawned process are returned.
   *
   * Requires `allow-run` permission. */
  export function run<T extends RunOptions = RunOptions>(opt: T): Process<T>;

  export interface InspectOptions {
    /** Stylize output with ANSI colors. Defaults to false. */
    colors?: boolean;
    /** Try to fit more than one entry of a collection on the same line.
     * Defaults to true. */
    compact?: boolean;
    /** Traversal depth for nested objects. Defaults to 4. */
    depth?: number;
    /** The maximum number of iterable entries to print. Defaults to 100. */
    iterableLimit?: number;
    /** Show a Proxy's target and handler. Defaults to false. */
    showProxy?: boolean;
    /** Sort Object, Set and Map entries by key. Defaults to false. */
    sorted?: boolean;
    /** Add a trailing comma for multiline collections. Defaults to false. */
    trailingComma?: boolean;
    /*** Evaluate the result of calling getters. Defaults to false. */
    getters?: boolean;
  }

  /** Converts the input into a string that has the same format as printed by
   * `console.log()`.
   *
   * ```ts
   * const obj = {};
   * obj.propA = 10;
   * obj.propB = "hello";
   * const objAsString = Deno.inspect(obj); // { propA: 10, propB: "hello" }
   * console.log(obj);  // prints same value as objAsString, e.g. { propA: 10, propB: "hello" }
   * ```
   *
   * You can also register custom inspect functions, via the `customInspect` Deno
   * symbol on objects, to control and customize the output.
   *
   * ```ts
   * class A {
   *   x = 10;
   *   y = "hello";
   *   [Deno.customInspect](): string {
   *     return "x=" + this.x + ", y=" + this.y;
   *   }
   * }
   * ```
   *
   *      const inStringFormat = Deno.inspect(new A()); // "x=10, y=hello"
   *      console.log(inStringFormat);  // prints "x=10, y=hello"
   *
   * Finally, you can also specify the depth to which it will format.
   *
   *      Deno.inspect({a: {b: {c: {d: 'hello'}}}}, {depth: 2}); // { a: { b: [Object] } }
   *
   */
  export function inspect(value: unknown, options?: InspectOptions): string;

  /** Build related information. */
  export const build: {
    /** The LLVM target triple */
    target: string;
    /** Instruction set architecture */
    arch: "x86_64";
    /** Operating system */
    os: "darwin" | "linux" | "windows";
    /** Computer vendor */
    vendor: string;
    /** Optional environment */
    env?: string;
  };

  /** Version related information. */
  export const version: {
    /** Deno's version. For example: `"1.0.0"` */
    deno: string;
    /** The V8 version used by Deno. For example: `"8.0.0.0"` */
    v8: string;
    /** The TypeScript version used by Deno. For example: `"4.0.0"` */
    typescript: string;
  };

  /** Returns the script arguments to the program. If for example we run a
   * program:
   *
   * deno run --allow-read https://deno.land/std/examples/cat.ts /etc/passwd
   *
   * Then `Deno.args` will contain:
   *
   * [ "/etc/passwd" ]
   */
  export const args: string[];

  /** A symbol which can be used as a key for a custom method which will be
   * called when `Deno.inspect()` is called, or when the object is logged to
   * the console. */
  export const customInspect: unique symbol;

  /** The URL of the entrypoint module entered from the command-line. */
  export const mainModule: string;
}

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

declare class DOMException extends Error {
  constructor(message?: string, name?: string);
  readonly name: string;
  readonly message: string;
  readonly code: number;
}

interface EventInit {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
}

/** An event which takes place in the DOM. */
declare class Event {
  constructor(type: string, eventInitDict?: EventInit);
  /** Returns true or false depending on how event was initialized. True if
     * event goes through its target's ancestors in reverse tree order, and
     * false otherwise. */
  readonly bubbles: boolean;
  cancelBubble: boolean;
  /** Returns true or false depending on how event was initialized. Its return
     * value does not always carry meaning, but true can indicate that part of the
     * operation during which event was dispatched, can be canceled by invoking
     * the preventDefault() method. */
  readonly cancelable: boolean;
  /** Returns true or false depending on how event was initialized. True if
     * event invokes listeners past a ShadowRoot node that is the root of its
     * target, and false otherwise. */
  readonly composed: boolean;
  /** Returns the object whose event listener's callback is currently being
     * invoked. */
  readonly currentTarget: EventTarget | null;
  /** Returns true if preventDefault() was invoked successfully to indicate
     * cancellation, and false otherwise. */
  readonly defaultPrevented: boolean;
  /** Returns the event's phase, which is one of NONE, CAPTURING_PHASE,
     * AT_TARGET, and BUBBLING_PHASE. */
  readonly eventPhase: number;
  /** Returns true if event was dispatched by the user agent, and false
     * otherwise. */
  readonly isTrusted: boolean;
  /** Returns the object to which event is dispatched (its target). */
  readonly target: EventTarget | null;
  /** Returns the event's timestamp as the number of milliseconds measured
     * relative to the time origin. */
  readonly timeStamp: number;
  /** Returns the type of event, e.g. "click", "hashchange", or "submit". */
  readonly type: string;
  /** Returns the invocation target objects of event's path (objects on which
     * listeners will be invoked), except for any nodes in shadow trees of which
     * the shadow root's mode is "closed" that are not reachable from event's
     * currentTarget. */
  composedPath(): EventTarget[];
  /** If invoked when the cancelable attribute value is true, and while
     * executing a listener for the event with passive set to false, signals to
     * the operation that caused event to be dispatched that it needs to be
     * canceled. */
  preventDefault(): void;
  /** Invoking this method prevents event from reaching any registered event
     * listeners after the current one finishes running and, when dispatched in a
     * tree, also prevents event from reaching any other objects. */
  stopImmediatePropagation(): void;
  /** When dispatched in a tree, invoking this method prevents event from
     * reaching any objects other than the current object. */
  stopPropagation(): void;
  readonly AT_TARGET: number;
  readonly BUBBLING_PHASE: number;
  readonly CAPTURING_PHASE: number;
  readonly NONE: number;
  static readonly AT_TARGET: number;
  static readonly BUBBLING_PHASE: number;
  static readonly CAPTURING_PHASE: number;
  static readonly NONE: number;
}

/**
   * EventTarget is a DOM interface implemented by objects that can receive events
   * and may have listeners for them.
   */
declare class EventTarget {
  /** Appends an event listener for events whose type attribute value is type.
     * The callback argument sets the callback that will be invoked when the event
     * is dispatched.
     *
     * The options argument sets listener-specific options. For compatibility this
     * can be a boolean, in which case the method behaves exactly as if the value
     * was specified as options's capture.
     *
     * When set to true, options's capture prevents callback from being invoked
     * when the event's eventPhase attribute value is BUBBLING_PHASE. When false
     * (or not present), callback will not be invoked when event's eventPhase
     * attribute value is CAPTURING_PHASE. Either way, callback will be invoked if
     * event's eventPhase attribute value is AT_TARGET.
     *
     * When set to true, options's passive indicates that the callback will not
     * cancel the event by invoking preventDefault(). This is used to enable
     * performance optimizations described in § 2.8 Observing event listeners.
     *
     * When set to true, options's once indicates that the callback will only be
     * invoked once after which the event listener will be removed.
     *
     * The event listener is appended to target's event listener list and is not
     * appended if it has the same type, callback, and capture. */
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  /** Dispatches a synthetic event event to target and returns true if either
     * event's cancelable attribute value is false or its preventDefault() method
     * was not invoked, and false otherwise. */
  dispatchEvent(event: Event): boolean;
  /** Removes the event listener in target's event listener list with the same
     * type, callback, and options. */
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
  [Symbol.toStringTag]: string;
}

interface EventListener {
  (evt: Event): void | Promise<void>;
}

interface EventListenerObject {
  handleEvent(evt: Event): void | Promise<void>;
}

declare type EventListenerOrEventListenerObject =
  | EventListener
  | EventListenerObject;

interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
}

interface EventListenerOptions {
  capture?: boolean;
}

interface ProgressEventInit extends EventInit {
  lengthComputable?: boolean;
  loaded?: number;
  total?: number;
}

/** Events measuring progress of an underlying process, like an HTTP request
 * (for an XMLHttpRequest, or the loading of the underlying resource of an
 * <img>, <audio>, <video>, <style> or <link>). */
declare class ProgressEvent<T extends EventTarget = EventTarget> extends Event {
  constructor(type: string, eventInitDict?: ProgressEventInit);
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly target: T | null;
  readonly total: number;
}

/** Decodes a string of data which has been encoded using base-64 encoding.
 *
 *     console.log(atob("aGVsbG8gd29ybGQ=")); // outputs 'hello world'
 */
declare function atob(s: string): string;

/** Creates a base-64 ASCII encoded string from the input string.
 *
 *     console.log(btoa("hello world"));  // outputs "aGVsbG8gd29ybGQ="
 */
declare function btoa(s: string): string;

declare class TextDecoder {
  /** Returns encoding's name, lowercased. */
  readonly encoding: string;
  /** Returns `true` if error mode is "fatal", and `false` otherwise. */
  readonly fatal: boolean;
  /** Returns `true` if ignore BOM flag is set, and `false` otherwise. */
  readonly ignoreBOM = false;
  constructor(
    label?: string,
    options?: { fatal?: boolean; ignoreBOM?: boolean },
  );
  /** Returns the result of running encoding's decoder. */
  decode(input?: BufferSource, options?: { stream?: false }): string;
  readonly [Symbol.toStringTag]: string;
}

declare class TextEncoder {
  /** Returns "utf-8". */
  readonly encoding = "utf-8";
  /** Returns the result of running UTF-8's encoder. */
  encode(input?: string): Uint8Array;
  encodeInto(
    input: string,
    dest: Uint8Array,
  ): { read: number; written: number };
  readonly [Symbol.toStringTag]: string;
}

/** A controller object that allows you to abort one or more DOM requests as and
 * when desired. */
declare class AbortController {
  /** Returns the AbortSignal object associated with this object. */
  readonly signal: AbortSignal;
  /** Invoking this method will set this object's AbortSignal's aborted flag and
    * signal to any observers that the associated activity is to be aborted. */
  abort(): void;
}

interface AbortSignalEventMap {
  abort: Event;
}

/** A signal object that allows you to communicate with a DOM request (such as a
  * Fetch) and abort it if required via an AbortController object. */
interface AbortSignal extends EventTarget {
  /** Returns true if this AbortSignal's AbortController has signaled to abort,
    * and false otherwise. */
  readonly aborted: boolean;
  onabort: ((this: AbortSignal, ev: Event) => any) | null;
  addEventListener<K extends keyof AbortSignalEventMap>(
    type: K,
    listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof AbortSignalEventMap>(
    type: K,
    listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

declare var AbortSignal: {
  prototype: AbortSignal;
  new(): AbortSignal;
};

interface FileReaderEventMap {
  "abort": ProgressEvent<FileReader>;
  "error": ProgressEvent<FileReader>;
  "load": ProgressEvent<FileReader>;
  "loadend": ProgressEvent<FileReader>;
  "loadstart": ProgressEvent<FileReader>;
  "progress": ProgressEvent<FileReader>;
}

/** Lets web applications asynchronously read the contents of files (or raw data buffers) stored on the user's computer, using File or Blob objects to specify the file or data to read. */
interface FileReader extends EventTarget {
  readonly error: DOMException | null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onloadstart:
  | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
  | null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  readonly readyState: number;
  readonly result: string | ArrayBuffer | null;
  abort(): void;
  readAsArrayBuffer(blob: Blob): void;
  readAsBinaryString(blob: Blob): void;
  readAsDataURL(blob: Blob): void;
  readAsText(blob: Blob, encoding?: string): void;
  readonly DONE: number;
  readonly EMPTY: number;
  readonly LOADING: number;
  addEventListener<K extends keyof FileReaderEventMap>(
    type: K,
    listener: (this: FileReader, ev: FileReaderEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof FileReaderEventMap>(
    type: K,
    listener: (this: FileReader, ev: FileReaderEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

declare var FileReader: {
  prototype: FileReader;
  new(): FileReader;
  readonly DONE: number;
  readonly EMPTY: number;
  readonly LOADING: number;
};

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

interface DomIterable<K, V> {
  keys(): IterableIterator<K>;
  values(): IterableIterator<V>;
  entries(): IterableIterator<[K, V]>;
  [Symbol.iterator](): IterableIterator<[K, V]>;
  forEach(
    callback: (value: V, key: K, parent: this) => void,
    thisArg?: any,
  ): void;
}

interface ReadableStreamReadDoneResult<T> {
  done: true;
  value?: T;
}

interface ReadableStreamReadValueResult<T> {
  done: false;
  value: T;
}

type ReadableStreamReadResult<T> =
  | ReadableStreamReadValueResult<T>
  | ReadableStreamReadDoneResult<T>;

interface ReadableStreamDefaultReader<R = any> {
  readonly closed: Promise<void>;
  cancel(reason?: any): Promise<void>;
  read(): Promise<ReadableStreamReadResult<R>>;
  releaseLock(): void;
}

declare var ReadableStreamDefaultReader: {
  prototype: ReadableStreamDefaultReader;
  new <R>(stream: ReadableStream<R>): ReadableStreamDefaultReader<R>;
};

interface ReadableStreamReader<R = any> {
  cancel(): Promise<void>;
  read(): Promise<ReadableStreamReadResult<R>>;
  releaseLock(): void;
}

declare var ReadableStreamReader: {
  prototype: ReadableStreamReader;
  new(): ReadableStreamReader;
};

interface ReadableByteStreamControllerCallback {
  (controller: ReadableByteStreamController): void | PromiseLike<void>;
}

interface UnderlyingByteSource {
  autoAllocateChunkSize?: number;
  cancel?: ReadableStreamErrorCallback;
  pull?: ReadableByteStreamControllerCallback;
  start?: ReadableByteStreamControllerCallback;
  type: "bytes";
}

interface UnderlyingSink<W = any> {
  abort?: WritableStreamErrorCallback;
  close?: WritableStreamDefaultControllerCloseCallback;
  start?: WritableStreamDefaultControllerStartCallback;
  type?: undefined;
  write?: WritableStreamDefaultControllerWriteCallback<W>;
}

interface UnderlyingSource<R = any> {
  cancel?: ReadableStreamErrorCallback;
  pull?: ReadableStreamDefaultControllerCallback<R>;
  start?: ReadableStreamDefaultControllerCallback<R>;
  type?: undefined;
}

interface ReadableStreamErrorCallback {
  (reason: any): void | PromiseLike<void>;
}

interface ReadableStreamDefaultControllerCallback<R> {
  (controller: ReadableStreamDefaultController<R>): void | PromiseLike<void>;
}

interface ReadableStreamDefaultController<R = any> {
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk: R): void;
  error(error?: any): void;
}

declare var ReadableStreamDefaultController: {
  prototype: ReadableStreamDefaultController;
  new(): ReadableStreamDefaultController;
};

interface ReadableByteStreamController {
  readonly byobRequest: undefined;
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk: ArrayBufferView): void;
  error(error?: any): void;
}

declare var ReadableByteStreamController: {
  prototype: ReadableByteStreamController;
  new(): ReadableByteStreamController;
};

interface PipeOptions {
  preventAbort?: boolean;
  preventCancel?: boolean;
  preventClose?: boolean;
  signal?: AbortSignal;
}

interface QueuingStrategySizeCallback<T = any> {
  (chunk: T): number;
}

interface QueuingStrategy<T = any> {
  highWaterMark?: number;
  size?: QueuingStrategySizeCallback<T>;
}

/** This Streams API interface provides a built-in byte length queuing strategy
 * that can be used when constructing streams. */
declare class CountQueuingStrategy implements QueuingStrategy {
  constructor(options: { highWaterMark: number });
  highWaterMark: number;
  size(chunk: any): 1;
}

declare class ByteLengthQueuingStrategy
  implements QueuingStrategy<ArrayBufferView> {
  constructor(options: { highWaterMark: number });
  highWaterMark: number;
  size(chunk: ArrayBufferView): number;
}

/** This Streams API interface represents a readable stream of byte data. The
 * Fetch API offers a concrete instance of a ReadableStream through the body
 * property of a Response object. */
interface ReadableStream<R = any> {
  readonly locked: boolean;
  cancel(reason?: any): Promise<void>;
  /**
   * @deprecated This is no longer part of the Streams standard and the async
   *             iterable should be obtained by just using the stream as an
   *             async iterator.
   */
  getIterator(options?: { preventCancel?: boolean }): AsyncIterableIterator<R>;
  getReader(): ReadableStreamDefaultReader<R>;
  pipeThrough<T>(
    { writable, readable }: {
      writable: WritableStream<R>;
      readable: ReadableStream<T>;
    },
    options?: PipeOptions,
  ): ReadableStream<T>;
  pipeTo(dest: WritableStream<R>, options?: PipeOptions): Promise<void>;
  tee(): [ReadableStream<R>, ReadableStream<R>];
  [Symbol.asyncIterator](options?: {
    preventCancel?: boolean;
  }): AsyncIterableIterator<R>;
}

declare var ReadableStream: {
  prototype: ReadableStream;
  new(
    underlyingSource: UnderlyingByteSource,
    strategy?: { highWaterMark?: number; size?: undefined },
  ): ReadableStream<Uint8Array>;
  new <R = any>(
    underlyingSource?: UnderlyingSource<R>,
    strategy?: QueuingStrategy<R>,
  ): ReadableStream<R>;
};

interface WritableStreamDefaultControllerCloseCallback {
  (): void | PromiseLike<void>;
}

interface WritableStreamDefaultControllerStartCallback {
  (controller: WritableStreamDefaultController): void | PromiseLike<void>;
}

interface WritableStreamDefaultControllerWriteCallback<W> {
  (chunk: W, controller: WritableStreamDefaultController):
    | void
    | PromiseLike<
      void
    >;
}

interface WritableStreamErrorCallback {
  (reason: any): void | PromiseLike<void>;
}

/** This Streams API interface provides a standard abstraction for writing
 * streaming data to a destination, known as a sink. This object comes with
 * built-in backpressure and queuing. */
interface WritableStream<W = any> {
  readonly locked: boolean;
  abort(reason?: any): Promise<void>;
  getWriter(): WritableStreamDefaultWriter<W>;
}

declare var WritableStream: {
  prototype: WritableStream;
  new <W = any>(
    underlyingSink?: UnderlyingSink<W>,
    strategy?: QueuingStrategy<W>,
  ): WritableStream<W>;
};

/** This Streams API interface represents a controller allowing control of a
 * WritableStream's state. When constructing a WritableStream, the underlying
 * sink is given a corresponding WritableStreamDefaultController instance to
 * manipulate. */
interface WritableStreamDefaultController {
  error(error?: any): void;
}

/** This Streams API interface is the object returned by
 * WritableStream.getWriter() and once created locks the < writer to the
 * WritableStream ensuring that no other streams can write to the underlying
 * sink. */
interface WritableStreamDefaultWriter<W = any> {
  readonly closed: Promise<void>;
  readonly desiredSize: number | null;
  readonly ready: Promise<void>;
  abort(reason?: any): Promise<void>;
  close(): Promise<void>;
  releaseLock(): void;
  write(chunk: W): Promise<void>;
}

declare var WritableStreamDefaultWriter: {
  prototype: WritableStreamDefaultWriter;
  new(): WritableStreamDefaultWriter;
};

interface TransformStream<I = any, O = any> {
  readonly readable: ReadableStream<O>;
  readonly writable: WritableStream<I>;
}

declare var TransformStream: {
  prototype: TransformStream;
  new <I = any, O = any>(
    transformer?: Transformer<I, O>,
    writableStrategy?: QueuingStrategy<I>,
    readableStrategy?: QueuingStrategy<O>,
  ): TransformStream<I, O>;
};

interface TransformStreamDefaultController<O = any> {
  readonly desiredSize: number | null;
  enqueue(chunk: O): void;
  error(reason?: any): void;
  terminate(): void;
}

interface Transformer<I = any, O = any> {
  flush?: TransformStreamDefaultControllerCallback<O>;
  readableType?: undefined;
  start?: TransformStreamDefaultControllerCallback<O>;
  transform?: TransformStreamDefaultControllerTransformCallback<I, O>;
  writableType?: undefined;
}

interface TransformStreamDefaultControllerCallback<O> {
  (controller: TransformStreamDefaultController<O>): void | PromiseLike<void>;
}

interface TransformStreamDefaultControllerTransformCallback<I, O> {
  (
    chunk: I,
    controller: TransformStreamDefaultController<O>,
  ): void | PromiseLike<void>;
}

type BlobPart = BufferSource | Blob | string;

interface BlobPropertyBag {
  type?: string;
  ending?: "transparent" | "native";
}

/** A file-like object of immutable, raw data. Blobs represent data that isn't necessarily in a JavaScript-native format. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the user's system. */
declare class Blob {
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag);

  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start?: number, end?: number, contentType?: string): Blob;
  stream(): ReadableStream;
  text(): Promise<string>;
}

interface FilePropertyBag extends BlobPropertyBag {
  lastModified?: number;
}

/** Provides information about files and allows JavaScript in a web page to
 * access their content. */
declare class File extends Blob {
  constructor(
    fileBits: BlobPart[],
    fileName: string,
    options?: FilePropertyBag,
  );

  readonly lastModified: number;
  readonly name: string;
}

type FormDataEntryValue = File | string;

/** Provides a way to easily construct a set of key/value pairs representing
 * form fields and their values, which can then be easily sent using the
 * XMLHttpRequest.send() method. It uses the same format a form would use if the
 * encoding type were set to "multipart/form-data". */
declare class FormData implements DomIterable<string, FormDataEntryValue> {
  // TODO(ry) FormData constructor is non-standard.
  // new(form?: HTMLFormElement): FormData;
  constructor();

  append(name: string, value: string | Blob, fileName?: string): void;
  delete(name: string): void;
  get(name: string): FormDataEntryValue | null;
  getAll(name: string): FormDataEntryValue[];
  has(name: string): boolean;
  set(name: string, value: string | Blob, fileName?: string): void;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  entries(): IterableIterator<[string, FormDataEntryValue]>;
  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>;
  forEach(
    callback: (value: FormDataEntryValue, key: string, parent: this) => void,
    thisArg?: any,
  ): void;
}

interface Body {
  /** A simple getter used to expose a `ReadableStream` of the body contents. */
  readonly body: ReadableStream<Uint8Array> | null;
  /** Stores a `Boolean` that declares whether the body has been used in a
   * response yet.
   */
  readonly bodyUsed: boolean;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with an `ArrayBuffer`.
   */
  arrayBuffer(): Promise<ArrayBuffer>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `Blob`.
   */
  blob(): Promise<Blob>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `FormData` object.
   */
  formData(): Promise<FormData>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with the result of parsing the body text as JSON.
   */
  json(): Promise<any>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `USVString` (text).
   */
  text(): Promise<string>;
}

type HeadersInit = Headers | string[][] | Record<string, string>;

/** This Fetch API interface allows you to perform various actions on HTTP
 * request and response headers. These actions include retrieving, setting,
 * adding to, and removing. A Headers object has an associated header list,
 * which is initially empty and consists of zero or more name and value pairs.
 * You can add to this using methods like append() (see Examples). In all
 * methods of this interface, header names are matched by case-insensitive byte
 * sequence. */
interface Headers {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(
    callbackfn: (value: string, key: string, parent: Headers) => void,
    thisArg?: any,
  ): void;
}

declare class Headers implements DomIterable<string, string> {
  constructor(init?: HeadersInit);

  /** Appends a new value onto an existing header inside a `Headers` object, or
   * adds the header if it does not already exist.
   */
  append(name: string, value: string): void;
  /** Deletes a header from a `Headers` object. */
  delete(name: string): void;
  /** Returns an iterator allowing to go through all key/value pairs
   * contained in this Headers object. The both the key and value of each pairs
   * are ByteString objects.
   */
  entries(): IterableIterator<[string, string]>;
  /** Returns a `ByteString` sequence of all the values of a header within a
   * `Headers` object with a given name.
   */
  get(name: string): string | null;
  /** Returns a boolean stating whether a `Headers` object contains a certain
   * header.
   */
  has(name: string): boolean;
  /** Returns an iterator allowing to go through all keys contained in
   * this Headers object. The keys are ByteString objects.
   */
  keys(): IterableIterator<string>;
  /** Sets a new value for an existing header inside a Headers object, or adds
   * the header if it does not already exist.
   */
  set(name: string, value: string): void;
  /** Returns an iterator allowing to go through all values contained in
   * this Headers object. The values are ByteString objects.
   */
  values(): IterableIterator<string>;
  forEach(
    callbackfn: (value: string, key: string, parent: this) => void,
    thisArg?: any,
  ): void;
  /** The Symbol.iterator well-known symbol specifies the default
   * iterator for this Headers object
   */
  [Symbol.iterator](): IterableIterator<[string, string]>;
}

type RequestInfo = Request | string;
type RequestCache =
  | "default"
  | "force-cache"
  | "no-cache"
  | "no-store"
  | "only-if-cached"
  | "reload";
type RequestCredentials = "include" | "omit" | "same-origin";
type RequestMode = "cors" | "navigate" | "no-cors" | "same-origin";
type RequestRedirect = "error" | "follow" | "manual";
type ReferrerPolicy =
  | ""
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";
type BodyInit =
  | Blob
  | BufferSource
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>
  | string;
type RequestDestination =
  | ""
  | "audio"
  | "audioworklet"
  | "document"
  | "embed"
  | "font"
  | "image"
  | "manifest"
  | "object"
  | "paintworklet"
  | "report"
  | "script"
  | "sharedworker"
  | "style"
  | "track"
  | "video"
  | "worker"
  | "xslt";

interface RequestInit {
  /**
   * A BodyInit object or null to set request's body.
   */
  body?: BodyInit | null;
  /**
   * A string indicating how the request will interact with the browser's cache
   * to set request's cache.
   */
  cache?: RequestCache;
  /**
   * A string indicating whether credentials will be sent with the request
   * always, never, or only when sent to a same-origin URL. Sets request's
   * credentials.
   */
  credentials?: RequestCredentials;
  /**
   * A Headers object, an object literal, or an array of two-item arrays to set
   * request's headers.
   */
  headers?: HeadersInit;
  /**
   * A cryptographic hash of the resource to be fetched by request. Sets
   * request's integrity.
   */
  integrity?: string;
  /**
   * A boolean to set request's keepalive.
   */
  keepalive?: boolean;
  /**
   * A string to set request's method.
   */
  method?: string;
  /**
   * A string to indicate whether the request will use CORS, or will be
   * restricted to same-origin URLs. Sets request's mode.
   */
  mode?: RequestMode;
  /**
   * A string indicating whether request follows redirects, results in an error
   * upon encountering a redirect, or returns the redirect (in an opaque
   * fashion). Sets request's redirect.
   */
  redirect?: RequestRedirect;
  /**
   * A string whose value is a same-origin URL, "about:client", or the empty
   * string, to set request's referrer.
   */
  referrer?: string;
  /**
   * A referrer policy to set request's referrerPolicy.
   */
  referrerPolicy?: ReferrerPolicy;
  /**
   * An AbortSignal to set request's signal.
   */
  signal?: AbortSignal | null;
  /**
   * Can only be null. Used to disassociate request from any Window.
   */
  window?: any;
}

/** This Fetch API interface represents a resource request. */
declare class Request implements Body {
  constructor(input: RequestInfo, init?: RequestInit);

  /**
   * Returns the cache mode associated with request, which is a string
   * indicating how the request will interact with the browser's cache when
   * fetching.
   */
  readonly cache: RequestCache;
  /**
   * Returns the credentials mode associated with request, which is a string
   * indicating whether credentials will be sent with the request always, never,
   * or only when sent to a same-origin URL.
   */
  readonly credentials: RequestCredentials;
  /**
   * Returns the kind of resource requested by request, e.g., "document" or "script".
   */
  readonly destination: RequestDestination;
  /**
   * Returns a Headers object consisting of the headers associated with request.
   * Note that headers added in the network layer by the user agent will not be
   * accounted for in this object, e.g., the "Host" header.
   */
  readonly headers: Headers;
  /**
   * Returns request's subresource integrity metadata, which is a cryptographic
   * hash of the resource being fetched. Its value consists of multiple hashes
   * separated by whitespace. [SRI]
   */
  readonly integrity: string;
  /**
   * Returns a boolean indicating whether or not request is for a history
   * navigation (a.k.a. back-forward navigation).
   */
  readonly isHistoryNavigation: boolean;
  /**
   * Returns a boolean indicating whether or not request is for a reload
   * navigation.
   */
  readonly isReloadNavigation: boolean;
  /**
   * Returns a boolean indicating whether or not request can outlive the global
   * in which it was created.
   */
  readonly keepalive: boolean;
  /**
   * Returns request's HTTP method, which is "GET" by default.
   */
  readonly method: string;
  /**
   * Returns the mode associated with request, which is a string indicating
   * whether the request will use CORS, or will be restricted to same-origin
   * URLs.
   */
  readonly mode: RequestMode;
  /**
   * Returns the redirect mode associated with request, which is a string
   * indicating how redirects for the request will be handled during fetching. A
   * request will follow redirects by default.
   */
  readonly redirect: RequestRedirect;
  /**
   * Returns the referrer of request. Its value can be a same-origin URL if
   * explicitly set in init, the empty string to indicate no referrer, and
   * "about:client" when defaulting to the global's default. This is used during
   * fetching to determine the value of the `Referer` header of the request
   * being made.
   */
  readonly referrer: string;
  /**
   * Returns the referrer policy associated with request. This is used during
   * fetching to compute the value of the request's referrer.
   */
  readonly referrerPolicy: ReferrerPolicy;
  /**
   * Returns the signal associated with request, which is an AbortSignal object
   * indicating whether or not request has been aborted, and its abort event
   * handler.
   */
  readonly signal: AbortSignal;
  /**
   * Returns the URL of request as a string.
   */
  readonly url: string;
  clone(): Request;

  /** A simple getter used to expose a `ReadableStream` of the body contents. */
  readonly body: ReadableStream<Uint8Array> | null;
  /** Stores a `Boolean` that declares whether the body has been used in a
   * response yet.
   */
  readonly bodyUsed: boolean;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with an `ArrayBuffer`.
   */
  arrayBuffer(): Promise<ArrayBuffer>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `Blob`.
   */
  blob(): Promise<Blob>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `FormData` object.
   */
  formData(): Promise<FormData>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with the result of parsing the body text as JSON.
   */
  json(): Promise<any>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `USVString` (text).
   */
  text(): Promise<string>;
}

interface ResponseInit {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
}

type ResponseType =
  | "basic"
  | "cors"
  | "default"
  | "error"
  | "opaque"
  | "opaqueredirect";

/** This Fetch API interface represents the response to a request. */
declare class Response implements Body {
  constructor(body?: BodyInit | null, init?: ResponseInit);
  static error(): Response;
  static redirect(url: string, status?: number): Response;

  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly trailer: Promise<Headers>;
  readonly type: ResponseType;
  readonly url: string;
  clone(): Response;

  /** A simple getter used to expose a `ReadableStream` of the body contents. */
  readonly body: ReadableStream<Uint8Array> | null;
  /** Stores a `Boolean` that declares whether the body has been used in a
   * response yet.
   */
  readonly bodyUsed: boolean;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with an `ArrayBuffer`.
   */
  arrayBuffer(): Promise<ArrayBuffer>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `Blob`.
   */
  blob(): Promise<Blob>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `FormData` object.
   */
  formData(): Promise<FormData>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with the result of parsing the body text as JSON.
   */
  json(): Promise<any>;
  /** Takes a `Response` stream and reads it to completion. It returns a promise
   * that resolves with a `USVString` (text).
   */
  text(): Promise<string>;
}

/** Fetch a resource from the network. It returns a Promise that resolves to the
 * Response to that request, whether it is successful or not.
 *
 *     const response = await fetch("http://my.json.host/data.json");
 *     console.log(response.status);  // e.g. 200
 *     console.log(response.statusText); // e.g. "OK"
 *     const jsonData = await response.json();
 */
declare function fetch(
  input: Request | URL | string,
  init?: RequestInit,
): Promise<Response>;

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

interface CloseEventInit extends EventInit {
  code?: number;
  reason?: string;
  wasClean?: boolean;
}

declare class CloseEvent extends Event {
  constructor(type: string, eventInitDict?: CloseEventInit);
  /**
   * Returns the WebSocket connection close code provided by the server.
   */
  readonly code: number;
  /**
   * Returns the WebSocket connection close reason provided by the server.
   */
  readonly reason: string;
  /**
   * Returns true if the connection closed cleanly; false otherwise.
   */
  readonly wasClean: boolean;
}

interface WebSocketEventMap {
  close: CloseEvent;
  error: Event;
  message: MessageEvent;
  open: Event;
}

/** Provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection. */
declare class WebSocket extends EventTarget {
  constructor(url: string, protocols?: string | string[]);

  static readonly CLOSED: number;
  static readonly CLOSING: number;
  static readonly CONNECTING: number;
  static readonly OPEN: number;

  /**
   * Returns a string that indicates how binary data from the WebSocket object is exposed to scripts:
   *
   * Can be set, to change how binary data is returned. The default is "blob".
   */
  binaryType: BinaryType;
  /**
   * Returns the number of bytes of application data (UTF-8 text and binary data) that have been queued using send() but not yet been transmitted to the network.
   *
   * If the WebSocket connection is closed, this attribute's value will only increase with each call to the send() method. (The number does not reset to zero once the connection closes.)
   */
  readonly bufferedAmount: number;
  /**
   * Returns the extensions selected by the server, if any.
   */
  readonly extensions: string;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
  onerror: ((this: WebSocket, ev: Event | ErrorEvent) => any) | null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
  onopen: ((this: WebSocket, ev: Event) => any) | null;
  /**
   * Returns the subprotocol selected by the server, if any. It can be used in conjunction with the array form of the constructor's second argument to perform subprotocol negotiation.
   */
  readonly protocol: string;
  /**
   * Returns the state of the WebSocket object's connection. It can have the values described below.
   */
  readonly readyState: number;
  /**
   * Returns the URL that was used to establish the WebSocket connection.
   */
  readonly url: string;
  /**
   * Closes the WebSocket connection, optionally using code as the the WebSocket connection close code and reason as the the WebSocket connection close reason.
   */
  close(code?: number, reason?: string): void;
  /**
   * Transmits data using the WebSocket connection. data can be a string, a Blob, an ArrayBuffer, or an ArrayBufferView.
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  readonly CLOSED: number;
  readonly CLOSING: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

type BinaryType = "arraybuffer" | "blob";

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// Documentation partially adapted from [MDN](https://developer.mozilla.org/),
// by Mozilla Contributors, which is licensed under CC-BY-SA 2.5.

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="deno.web" />
/// <reference lib="deno.fetch" />
/// <reference lib="deno.websocket" />

declare namespace WebAssembly {
  /**
   * The `WebAssembly.CompileError` object indicates an error during WebAssembly decoding or validation.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/CompileError)
   */
  export class CompileError extends Error {
    /** Creates a new `WebAssembly.CompileError` object. */
    constructor();
  }

  /**
   * A `WebAssembly.Global` object represents a global variable instance, accessible from
   * both JavaScript and importable/exportable across one or more `WebAssembly.Module`
   * instances. This allows dynamic linking of multiple modules.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Global)
   */
  export class Global {
    /** Creates a new `Global` object. */
    constructor(descriptor: GlobalDescriptor, v?: any);

    /**
     * The value contained inside the global variable — this can be used to directly set
     * and get the global's value.
     */
    value: any;

    /** Old-style method that returns the value contained inside the global variable. */
    valueOf(): any;
  }

  /**
   * A `WebAssembly.Instance` object is a stateful, executable instance of a `WebAssembly.Module`.
   * Instance objects contain all the Exported WebAssembly functions that allow calling into
   * WebAssembly code from JavaScript.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Instance)
   */
  export class Instance {
    /** Creates a new Instance object. */
    constructor(module: Module, importObject?: Imports);

    /**
     * Returns an object containing as its members all the functions exported from the
     * WebAssembly module instance, to allow them to be accessed and used by JavaScript.
     * Read-only.
     */
    readonly exports: Exports;
  }

  /**
   * The `WebAssembly.LinkError` object indicates an error during module instantiation
   * (besides traps from the start function).
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/LinkError)
   */
  export class LinkError extends Error {
    /** Creates a new WebAssembly.LinkError object. */
    constructor();
  }

  /**
   * The `WebAssembly.Memory` object is a resizable `ArrayBuffer` or `SharedArrayBuffer` that
   * holds the raw bytes of memory accessed by a WebAssembly Instance.
   *
   * A memory created by JavaScript or in WebAssembly code will be accessible and mutable
   * from both JavaScript and WebAssembly.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory)
   */
  export class Memory {
    /** Creates a new `Memory` object. */
    constructor(descriptor: MemoryDescriptor);

    /** An accessor property that returns the buffer contained in the memory. */
    readonly buffer: ArrayBuffer;

    /**
     * Increases the size of the memory instance by a specified number of WebAssembly
     * pages (each one is 64KB in size).
     */
    grow(delta: number): number;
  }

  /**
   * A `WebAssembly.Module` object contains stateless WebAssembly code that has already been compiled
   * by the browser — this can be efficiently shared with Workers, and instantiated multiple times.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Module)
   */
  export class Module {
    /** Creates a new `Module` object. */
    constructor(bytes: BufferSource);

    /**
     * Given a `Module` and string, returns a copy of the contents of all custom sections in the
     * module with the given string name.
     * */
    static customSections(
      moduleObject: Module,
      sectionName: string,
    ): ArrayBuffer[];

    /** Given a `Module`, returns an array containing descriptions of all the declared exports. */
    static exports(moduleObject: Module): ModuleExportDescriptor[];

    /** Given a `Module`, returns an array containing descriptions of all the declared imports. */
    static imports(moduleObject: Module): ModuleImportDescriptor[];
  }

  /**
   * The `WebAssembly.RuntimeError` object is the error type that is thrown whenever WebAssembly
   * specifies a trap.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/RuntimeError)
   */
  export class RuntimeError extends Error {
    /** Creates a new `WebAssembly.RuntimeError` object. */
    constructor();
  }

  /**
   * The `WebAssembly.Table()` object is a JavaScript wrapper object — an array-like structure
   * representing a WebAssembly Table, which stores function references. A table created by
   * JavaScript or in WebAssembly code will be accessible and mutable from both JavaScript
   * and WebAssembly.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table)
   */
  export class Table {
    /** Creates a new `Table` object. */
    constructor(descriptor: TableDescriptor);

    /** Returns the length of the table, i.e. the number of elements. */
    readonly length: number;

    /** Accessor function — gets the element stored at a given index. */
    get(index: number): Function | null;

    /** Increases the size of the `Table` instance by a specified number of elements. */
    grow(delta: number): number;

    /** Sets an element stored at a given index to a given value. */
    set(index: number, value: Function | null): void;
  }

  /** The `GlobalDescriptor` describes the options you can pass to `new WebAssembly.Global()`. */
  export interface GlobalDescriptor {
    mutable?: boolean;
    value: ValueType;
  }

  /** The `MemoryDescriptor` describes the options you can pass to `new WebAssembly.Memory()`. */
  export interface MemoryDescriptor {
    initial: number;
    maximum?: number;
  }

  /** A `ModuleExportDescriptor` is the description of a declared export in a `WebAssembly.Module`. */
  export interface ModuleExportDescriptor {
    kind: ImportExportKind;
    name: string;
  }

  /** A `ModuleImportDescriptor` is the description of a declared import in a `WebAssembly.Module`. */
  export interface ModuleImportDescriptor {
    kind: ImportExportKind;
    module: string;
    name: string;
  }

  /** The `TableDescriptor` describes the options you can pass to `new WebAssembly.Table()`. */
  export interface TableDescriptor {
    element: TableKind;
    initial: number;
    maximum?: number;
  }

  /** The value returned from `WebAssembly.instantiate` and `WebAssembly.instantiateStreaming`. */
  export interface WebAssemblyInstantiatedSource {
    /* A `WebAssembly.Instance` object that contains all the exported WebAssembly functions. */
    instance: Instance;

    /**
     * A `WebAssembly.Module` object representing the compiled WebAssembly module.
     * This `Module` can be instantiated again, or shared via postMessage().
     */
    module: Module;
  }

  export type ImportExportKind = "function" | "global" | "memory" | "table";
  export type TableKind = "anyfunc";
  export type ValueType = "f32" | "f64" | "i32" | "i64";
  export type ExportValue = Function | Global | Memory | Table;
  export type Exports = Record<string, ExportValue>;
  export type ImportValue = ExportValue | number;
  export type ModuleImports = Record<string, ImportValue>;
  export type Imports = Record<string, ModuleImports>;

  /**
   * The `WebAssembly.compile()` function compiles WebAssembly binary code into a
   * `WebAssembly.Module` object. This function is useful if it is necessary to compile
   * a module before it can be instantiated (otherwise, the `WebAssembly.instantiate()`
   * function should be used).
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compile)
   */
  export function compile(bytes: BufferSource): Promise<Module>;

  /**
   * The `WebAssembly.compileStreaming()` function compiles a `WebAssembly.Module`
   * directly from a streamed underlying source.  This function is useful if it
   * is necessary to a compile a module before it can be instantiated (otherwise,
   * the `WebAssembly.instantiateStreaming()` function should be used).
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compileStreaming)
   */
  export function compileStreaming(
    source: Response | Promise<Response>,
  ): Promise<Module>;

  /**
   * The WebAssembly.instantiate() function allows you to compile and instantiate
   * WebAssembly code.
   *
   * This overload takes the WebAssembly binary code, in the form of a typed
   * array or ArrayBuffer, and performs both compilation and instantiation in one step.
   * The returned Promise resolves to both a compiled WebAssembly.Module and its first
   * WebAssembly.Instance.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate)
   */
  export function instantiate(
    bytes: BufferSource,
    importObject?: Imports,
  ): Promise<WebAssemblyInstantiatedSource>;

  /**
   * The WebAssembly.instantiate() function allows you to compile and instantiate
   * WebAssembly code.
   *
   * This overload takes an already-compiled WebAssembly.Module and returns
   * a Promise that resolves to an Instance of that Module. This overload is useful
   * if the Module has already been compiled.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate)
   */
  export function instantiate(
    moduleObject: Module,
    importObject?: Imports,
  ): Promise<Instance>;

  /**
   * The `WebAssembly.instantiateStreaming()` function compiles and instantiates a
   * WebAssembly module directly from a streamed underlying source. This is the most
   * efficient, optimized way to load WebAssembly code.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiateStreaming)
   */
  export function instantiateStreaming(
    response: Response | PromiseLike<Response>,
    importObject?: Imports,
  ): Promise<WebAssemblyInstantiatedSource>;

  /**
   * The `WebAssembly.validate()` function validates a given typed array of
   * WebAssembly binary code, returning whether the bytes form a valid wasm
   * module (`true`) or not (`false`).
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/validate)
   */
  export function validate(bytes: BufferSource): boolean;
}

/** Sets a timer which executes a function once after the timer expires. Returns
 * an id which may be used to cancel the timeout.
 *
 *     setTimeout(() => { console.log('hello'); }, 500);
 */
declare function setTimeout(
  /** callback function to execute when timer expires */
  cb: (...args: any[]) => void,
  /** delay in ms */
  delay?: number,
  /** arguments passed to callback function */
  ...args: any[]
): number;

/** Repeatedly calls a function , with a fixed time delay between each call.
 *
 *     // Outputs 'hello' to the console every 500ms
 *     setInterval(() => { console.log('hello'); }, 500);
 */
declare function setInterval(
  /** callback function to execute when timer expires */
  cb: (...args: any[]) => void,
  /** delay in ms */
  delay?: number,
  /** arguments passed to callback function */
  ...args: any[]
): number;

/** Cancels a timed, repeating action which was previously started by a call
 * to `setInterval()`
 *
 *     const id = setInterval(() => {console.log('hello');}, 500);
 *     ...
 *     clearInterval(id);
 */
declare function clearInterval(id?: number): void;

/** Cancels a scheduled action initiated by `setTimeout()`
 *
 *     const id = setTimeout(() => {console.log('hello');}, 500);
 *     ...
 *     clearTimeout(id);
 */
declare function clearTimeout(id?: number): void;

interface VoidFunction {
  (): void;
}

/** A microtask is a short function which is executed after the function or
 * module which created it exits and only if the JavaScript execution stack is
 * empty, but before returning control to the event loop being used to drive the
 * script's execution environment. This event loop may be either the main event
 * loop or the event loop driving a web worker.
 *
 *     queueMicrotask(() => { console.log('This event loop stack is complete'); });
 */
declare function queueMicrotask(func: VoidFunction): void;

declare var crypto: Crypto;

/** Registers an event listener in the global scope, which will be called
 * synchronously whenever the event `type` is dispatched.
 *
 *     addEventListener('unload', () => { console.log('All finished!'); });
 *     ...
 *     dispatchEvent(new Event('unload'));
 */
declare function addEventListener(
  type: string,
  callback: EventListenerOrEventListenerObject | null,
  options?: boolean | AddEventListenerOptions | undefined,
): void;

/** Dispatches an event in the global scope, synchronously invoking any
 * registered event listeners for this event in the appropriate order. Returns
 * false if event is cancelable and at least one of the event handlers which
 * handled this event called Event.preventDefault(). Otherwise it returns true.
 *
 *     dispatchEvent(new Event('unload'));
 */
declare function dispatchEvent(event: Event): boolean;

/** Remove a previously registered event listener from the global scope
 *
 *     const lstnr = () => { console.log('hello'); };
 *     addEventListener('load', lstnr);
 *     removeEventListener('load', lstnr);
 */
declare function removeEventListener(
  type: string,
  callback: EventListenerOrEventListenerObject | null,
  options?: boolean | EventListenerOptions | undefined,
): void;

interface DOMStringList {
  /** Returns the number of strings in strings. */
  readonly length: number;
  /** Returns true if strings contains string, and false otherwise. */
  contains(string: string): boolean;
  /** Returns the string with index index from strings. */
  item(index: number): string | null;
  [index: number]: string;
}

type BufferSource = ArrayBufferView | ArrayBuffer;

declare interface Console {
  assert(condition?: boolean, ...data: any[]): void;
  clear(): void;
  count(label?: string): void;
  countReset(label?: string): void;
  debug(...data: any[]): void;
  dir(item?: any, options?: any): void;
  dirxml(...data: any[]): void;
  error(...data: any[]): void;
  group(...data: any[]): void;
  groupCollapsed(...data: any[]): void;
  groupEnd(): void;
  info(...data: any[]): void;
  log(...data: any[]): void;
  table(tabularData?: any, properties?: string[]): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  timeLog(label?: string, ...data: any[]): void;
  timeStamp(label?: string): void;
  trace(...data: any[]): void;
  warn(...data: any[]): void;
}

declare var console: Console;

declare interface Crypto {
  readonly subtle: null;
  getRandomValues<
    T extends
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array
    | DataView
    | null,
    >(
      array: T,
  ): T;
}

declare class URLSearchParams {
  constructor(
    init?: string[][] | Record<string, string> | string | URLSearchParams,
  );
  static toString(): string;

  /** Appends a specified key/value pair as a new search parameter.
   *
   * ```ts
   * let searchParams = new URLSearchParams();
   * searchParams.append('name', 'first');
   * searchParams.append('name', 'second');
   * ```
   */
  append(name: string, value: string): void;

  /** Deletes the given search parameter and its associated value,
   * from the list of all search parameters.
   *
   * ```ts
   * let searchParams = new URLSearchParams([['name', 'value']]);
   * searchParams.delete('name');
   * ```
   */
  delete(name: string): void;

  /** Returns all the values associated with a given search parameter
   * as an array.
   *
   * ```ts
   * searchParams.getAll('name');
   * ```
   */
  getAll(name: string): string[];

  /** Returns the first value associated to the given search parameter.
   *
   * ```ts
   * searchParams.get('name');
   * ```
   */
  get(name: string): string | null;

  /** Returns a Boolean that indicates whether a parameter with the
   * specified name exists.
   *
   * ```ts
   * searchParams.has('name');
   * ```
   */
  has(name: string): boolean;

  /** Sets the value associated with a given search parameter to the
   * given value. If there were several matching values, this method
   * deletes the others. If the search parameter doesn't exist, this
   * method creates it.
   *
   * ```ts
   * searchParams.set('name', 'value');
   * ```
   */
  set(name: string, value: string): void;

  /** Sort all key/value pairs contained in this object in place and
   * return undefined. The sort order is according to Unicode code
   * points of the keys.
   *
   * ```ts
   * searchParams.sort();
   * ```
   */
  sort(): void;

  /** Calls a function for each element contained in this object in
   * place and return undefined. Optionally accepts an object to use
   * as this when executing callback as second argument.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * params.forEach((value, key, parent) => {
   *   console.log(value, key, parent);
   * });
   * ```
   *
   */
  forEach(
    callbackfn: (value: string, key: string, parent: this) => void,
    thisArg?: any,
  ): void;

  /** Returns an iterator allowing to go through all keys contained
   * in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const key of params.keys()) {
   *   console.log(key);
   * }
   * ```
   */
  keys(): IterableIterator<string>;

  /** Returns an iterator allowing to go through all values contained
   * in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const value of params.values()) {
   *   console.log(value);
   * }
   * ```
   */
  values(): IterableIterator<string>;

  /** Returns an iterator allowing to go through all key/value
   * pairs contained in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const [key, value] of params.entries()) {
   *   console.log(key, value);
   * }
   * ```
   */
  entries(): IterableIterator<[string, string]>;

  /** Returns an iterator allowing to go through all key/value
   * pairs contained in this object.
   *
   * ```ts
   * const params = new URLSearchParams([["a", "b"], ["c", "d"]]);
   * for (const [key, value] of params) {
   *   console.log(key, value);
   * }
   * ```
   */
  [Symbol.iterator](): IterableIterator<[string, string]>;

  /** Returns a query string suitable for use in a URL.
   *
   * ```ts
   * searchParams.toString();
   * ```
   */
  toString(): string;
}

/** The URL interface represents an object providing static methods used for creating object URLs. */
declare class URL {
  constructor(url: string, base?: string | URL);
  createObjectURL(object: any): string;
  revokeObjectURL(url: string): void;

  hash: string;
  host: string;
  hostname: string;
  href: string;
  toString(): string;
  readonly origin: string;
  password: string;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  readonly searchParams: URLSearchParams;
  username: string;
  toJSON(): string;
}

interface MessageEventInit<T = any> extends EventInit {
  data?: T;
  origin?: string;
  lastEventId?: string;
}

declare class MessageEvent<T = any> extends Event {
  /**
   * Returns the data of the message.
   */
  readonly data: T;
  /**
   * Returns the last event ID string, for server-sent events.
   */
  readonly lastEventId: string;
  constructor(type: string, eventInitDict?: MessageEventInit);
}

interface ErrorEventInit extends EventInit {
  message?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: any;
}

declare class ErrorEvent extends Event {
  readonly message: string;
  readonly filename: string;
  readonly lineno: number;
  readonly colno: number;
  readonly error: any;
  constructor(type: string, eventInitDict?: ErrorEventInit);
}

interface PostMessageOptions {
  transfer?: any[];
}

interface AbstractWorkerEventMap {
  "error": ErrorEvent;
}

interface WorkerEventMap extends AbstractWorkerEventMap {
  "message": MessageEvent;
  "messageerror": MessageEvent;
}

interface WorkerOptions {
  type?: "classic" | "module";
  name?: string;
  /** UNSTABLE: New API.
   *
   * Set deno.namespace to `true` to make `Deno` namespace and all of its methods
   * available to worker thread. The namespace is disabled by default.
   *
   * Configure deno.permissions options to change the level of access the worker will
   * have. By default it will inherit the permissions of its parent thread. The permissions
   * of a worker can't be extended beyond its parent's permissions reach.
   * - "inherit" will take the permissions of the thread the worker is created in
   * - You can disable/enable permissions all together by passing a boolean
   * - You can provide a list of routes relative to the file the worker
   *   is created in to limit the access of the worker (read/write permissions only)
   *
   * Example:
   *
   * ```ts
   * // mod.ts
   * const worker = new Worker(
   *   new URL("deno_worker.ts", import.meta.url).href, {
   *     type: "module",
   *     deno: {
   *       namespace: true,
   *       permissions: {
   *         read: true,
   *       },
   *     },
   *   }
   * );
   * worker.postMessage({ cmd: "readFile", fileName: "./log.txt" });
   *
   * // deno_worker.ts
   *
   *
   * self.onmessage = async function (e) {
   *     const { cmd, fileName } = e.data;
   *     if (cmd !== "readFile") {
   *         throw new Error("Invalid command");
   *     }
   *     const buf = await Deno.readFile(fileName);
   *     const fileContents = new TextDecoder().decode(buf);
   *     console.log(fileContents);
   * }
   * ```
   *
   * // log.txt
   * hello world
   * hello world 2
   *
   * // run program
   * $ deno run --allow-read mod.ts
   * hello world
   * hello world2
   *
   */
  // TODO(Soremwar)
  // `deno: true` is kept for backwards compatibility with the previous worker
  // options implementation. Remove for 2.0.
  deno?: true | {
    namespace?: boolean;
    /** Set to `"none"` to disable all the permissions in the worker. */
    permissions?: "inherit" | "none" | {
      env?: "inherit" | boolean;
      hrtime?: "inherit" | boolean;
      /** The format of the net access list must be `hostname[:port]`
       * in order to be resolved.
       *
       * ```
       * net: ["https://deno.land", "localhost:8080"],
       * ```
       * */
      net?: "inherit" | boolean | string[];
      plugin?: "inherit" | boolean;
      read?: "inherit" | boolean | Array<string | URL>;
      run?: "inherit" | boolean;
      write?: "inherit" | boolean | Array<string | URL>;
    };
  };
}

declare class Worker extends EventTarget {
  onerror?: (e: ErrorEvent) => void;
  onmessage?: (e: MessageEvent) => void;
  onmessageerror?: (e: MessageEvent) => void;
  constructor(
    specifier: string,
    options?: WorkerOptions,
  );
  postMessage(message: any, transfer: ArrayBuffer[]): void;
  postMessage(message: any, options?: PostMessageOptions): void;
  addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  terminate(): void;
}

declare type PerformanceEntryList = PerformanceEntry[];

declare class Performance {
  constructor();

  /** Removes the stored timestamp with the associated name. */
  clearMarks(markName?: string): void;

  /** Removes stored timestamp with the associated name. */
  clearMeasures(measureName?: string): void;

  getEntries(): PerformanceEntryList;
  getEntriesByName(name: string, type?: string): PerformanceEntryList;
  getEntriesByType(type: string): PerformanceEntryList;

  /** Stores a timestamp with the associated name (a "mark"). */
  mark(markName: string, options?: PerformanceMarkOptions): PerformanceMark;

  /** Stores the `DOMHighResTimeStamp` duration between two marks along with the
   * associated name (a "measure"). */
  measure(
    measureName: string,
    options?: PerformanceMeasureOptions,
  ): PerformanceMeasure;
  /** Stores the `DOMHighResTimeStamp` duration between two marks along with the
   * associated name (a "measure"). */
  measure(
    measureName: string,
    startMark?: string,
    endMark?: string,
  ): PerformanceMeasure;

  /** Returns a current time from Deno's start in milliseconds.
   *
   * Use the permission flag `--allow-hrtime` return a precise value.
   *
   * ```ts
   * const t = performance.now();
   * console.log(`${t} ms since start!`);
   * ```
   */
  now(): number;
}

declare var performance: Performance;

declare interface PerformanceMarkOptions {
  /** Metadata to be included in the mark. */
  detail?: any;

  /** Timestamp to be used as the mark time. */
  startTime?: number;
}

declare interface PerformanceMeasureOptions {
  /** Metadata to be included in the measure. */
  detail?: any;

  /** Timestamp to be used as the start time or string to be used as start
   * mark.*/
  start?: string | number;

  /** Duration between the start and end times. */
  duration?: number;

  /** Timestamp to be used as the end time or string to be used as end mark. */
  end?: string | number;
}

/** Encapsulates a single performance metric that is part of the performance
 * timeline. A performance entry can be directly created by making a performance
 * mark or measure (for example by calling the `.mark()` method) at an explicit
 * point in an application. */
declare class PerformanceEntry {
  readonly duration: number;
  readonly entryType: string;
  readonly name: string;
  readonly startTime: number;
  toJSON(): any;
}

/** `PerformanceMark` is an abstract interface for `PerformanceEntry` objects
 * with an entryType of `"mark"`. Entries of this type are created by calling
 * `performance.mark()` to add a named `DOMHighResTimeStamp` (the mark) to the
 * performance timeline. */
declare class PerformanceMark extends PerformanceEntry {
  readonly detail: any;
  readonly entryType: "mark";
  constructor(name: string, options?: PerformanceMarkOptions);
}

/** `PerformanceMeasure` is an abstract interface for `PerformanceEntry` objects
 * with an entryType of `"measure"`. Entries of this type are created by calling
 * `performance.measure()` to add a named `DOMHighResTimeStamp` (the measure)
 * between two marks to the performance timeline. */
declare class PerformanceMeasure extends PerformanceEntry {
  readonly detail: any;
  readonly entryType: "measure";
}

declare interface CustomEventInit<T = any> extends EventInit {
  detail?: T;
}

declare class CustomEvent<T = any> extends Event {
  constructor(typeArg: string, eventInitDict?: CustomEventInit<T>);
  /** Returns any custom data event was created with. Typically used for
   * synthetic events. */
  readonly detail: T;
}

interface ErrorConstructor {
  /** See https://v8.dev/docs/stack-trace-api#stack-trace-collection-for-custom-exceptions. */
  captureStackTrace(error: Object, constructor?: Function): void;
  // TODO(nayeemrmn): Support `Error.prepareStackTrace()`. We currently use this
  // internally in a way that makes it unavailable for users.
}

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.shared_globals" />
/// <reference lib="esnext" />

declare class Window extends EventTarget {
  new(): Window;
  readonly window: Window & typeof globalThis;
  readonly self: Window & typeof globalThis;
  onload: ((this: Window, ev: Event) => any) | null;
  onunload: ((this: Window, ev: Event) => any) | null;
  close: () => void;
  readonly closed: boolean;
  alert: (message?: string) => void;
  confirm: (message?: string) => boolean;
  prompt: (message?: string, defaultValue?: string) => string | null;
  Deno: typeof Deno;
}

declare var window: Window & typeof globalThis;
declare var self: Window & typeof globalThis;
declare var onload: ((this: Window, ev: Event) => any) | null;
declare var onunload: ((this: Window, ev: Event) => any) | null;

/**
 * Shows the given message and waits for the enter key pressed.
 * If the stdin is not interactive, it does nothing.
 * @param message
 */
declare function alert(message?: string): void;

/**
 * Shows the given message and waits for the answer. Returns the user's answer as boolean.
 * Only `y` and `Y` are considered as true.
 * If the stdin is not interactive, it returns false.
 * @param message
 */
declare function confirm(message?: string): boolean;

/**
 * Shows the given message and waits for the user's input. Returns the user's input as string.
 * If the default value is given and the user inputs the empty string, then it returns the given
 * default value.
 * If the default value is not given and the user inputs the empty string, it returns null.
 * If the stdin is not interactive, it returns null.
 * @param message
 * @param defaultValue
 */
declare function prompt(message?: string, defaultValue?: string): string | null;

// TODO(nayeemrmn): Move this to `op_crates/web` where its implementation is.
// The types there must first be split into window, worker and global types.
/** The location (URL) of the object it is linked to. Changes done on it are
 * reflected on the object it relates to. Accessible via
 * `globalThis.location`. */
declare class Location {
  constructor();
  /** Returns a DOMStringList object listing the origins of the ancestor
   * browsing contexts, from the parent browsing context to the top-level
   * browsing context.
   *
   * Always empty in Deno. */
  readonly ancestorOrigins: DOMStringList;
  /** Returns the Location object's URL's fragment (includes leading "#" if
   * non-empty).
   *
   * Cannot be set in Deno. */
  hash: string;
  /** Returns the Location object's URL's host and port (if different from the
   * default port for the scheme).
   *
   * Cannot be set in Deno. */
  host: string;
  /** Returns the Location object's URL's host.
   *
   * Cannot be set in Deno. */
  hostname: string;
  /** Returns the Location object's URL.
   *
   * Cannot be set in Deno. */
  href: string;
  toString(): string;
  /** Returns the Location object's URL's origin. */
  readonly origin: string;
  /** Returns the Location object's URL's path.
   *
   * Cannot be set in Deno. */
  pathname: string;
  /** Returns the Location object's URL's port.
   *
   * Cannot be set in Deno. */
  port: string;
  /** Returns the Location object's URL's scheme.
   *
   * Cannot be set in Deno. */
  protocol: string;
  /** Returns the Location object's URL's query (includes leading "?" if
   * non-empty).
   *
   * Cannot be set in Deno. */
  search: string;
  /** Navigates to the given URL.
   *
   * Cannot be set in Deno. */
  assign(url: string): void;
  /** Reloads the current page.
   *
   * Disabled in Deno. */
  reload(): void;
  /** @deprecated */
  reload(forcedReload: boolean): void;
  /** Removes the current page from the session history and navigates to the
   * given URL.
   *
   * Disabled in Deno. */
  replace(url: string): void;
}

// TODO(nayeemrmn): Move this to `op_crates/web` where its implementation is.
// The types there must first be split into window, worker and global types.
declare var location: Location;
