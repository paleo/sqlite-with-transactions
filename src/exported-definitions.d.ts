import { BasicDatabaseConnection } from "./driver-definitions"

export interface MycnOptions {
  /**
   * Provided by a _mycn_ plugin.
   */
  provider: () => Promise<BasicDatabaseConnection>
  // /**
  //  * This callback will be executed once.
  //  */
  // onInit?(cn: BasicDatabaseConnection): Promise<void>
  /**
   * This callback will be executed for each new `DatabaseConnection` when it has a new underlying connection created by the pool. It is a right place to update the underlying connection with `PRAGMA` orders.
   */
  afterOpen?(cn: BasicDatabaseConnection): void | Promise<void>
  /**
   * This callback will be executed for each new `DatabaseConnection` object. It returns the same or another object that will be used as the `DatabaseConnection`.
   */
  modifyConnection?<T extends DatabaseConnection | TransactionConnection>(cn: T): T
  /**
   * This callback will be executed for each new `PreparedStatement` object. It returns the same or another object that will be used as the `PreparedStatement`.
   */
  modifyPreparedStatement?(ps: PreparedStatement): PreparedStatement | Promise<PreparedStatement>
  /**
   * The configuration of the connection pool.
   */
  poolOptions?: PoolOptions
  /**
   * If the option is `false` or `undefined`, then the method `ExecResult.getInsertedId()` throws an `Error` when the inserted ID is `undefined`.
   */
  insertedIdCanBeUndefined?: boolean
  /**
   * By default, unhandled errors will be logged with `console.error`.
   */
  logError?(error: any): void
  /**
   * Activate development mode.
   */
  debugLog?(debug: Debug): void
}

export interface ContextDebug {
  connection: BasicDatabaseConnection
  method: string
  args: any[]
  inTransaction: boolean
  idInPool: number
}

export interface Debug {
  callingContext?: ContextDebug
  /**
   * Set when an error occured
   */
  error?: any
  /**
   * Maybe defined only when there is no error
   */
  result?: any
}

export interface PoolMonitoring {
  event: "open" | "close" | "grab" | "release"
  cn: any
  id?: number
}

export interface PoolOptions {
  /**
   * In seconds. Default value is: 60.
   */
  connectionTtl?: number
  logMonitoring?(monitoring: PoolMonitoring): void
  keepOneConnection?: boolean
}

export type SqlParameters = any[] | { [key: string]: any }
export type ResultRow = {}

export interface QueryRunner {
  prepare<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<PreparedStatement<ROW>>
  exec(sql: string, params?: SqlParameters): Promise<ExecResult>

  all<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<ROW[]>
  singleRow<ROW extends ResultRow = any>(sql: string, params?: SqlParameters): Promise<ROW | undefined>
  singleValue<VAL = any>(sql: string, params?: SqlParameters): Promise<VAL | undefined | null>

  execScript(sql: string): Promise<void>
}

export interface DatabaseConnection extends QueryRunner {
  beginTransaction(): Promise<TransactionConnection>
  close(): Promise<void>
}

export interface TransactionConnection extends QueryRunner {
  readonly inTransaction: boolean
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface ExecResult {
  /**
   * When the ID is `undefined`, an exception is thrown, unless the option `insertedIdCanBeUndefined` is set to `true`.
   *
   * @param idColumnName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedId(idColumnName?: string): any
  /**
   * When the ID is `undefined`, an exception is thrown, unless the option `insertedIdCanBeUndefined` is set to `true`.
   *
   * @param idColumnName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedIdAsString(idColumnName?: string): string
  /**
   * When the ID is `undefined`, an exception is thrown, unless the option `insertedIdCanBeUndefined` is set to `true`.
   *
   * @param idColumnName For PostgreSQL, give here the column name of the autoincremented primary key
   */
  getInsertedIdAsNumber(idColumnName?: string): number
  readonly affectedRows: number
}

export interface PreparedStatement<PS extends ResultRow = any> {
  exec(params?: SqlParameters): Promise<ExecResult>

  all<ROW = PS>(params?: SqlParameters): Promise<ROW[]>
  singleRow<ROW = PS>(params?: SqlParameters): Promise<ROW | undefined>
  singleValue<VAL>(params?: SqlParameters): Promise<VAL | undefined | null>

  fetch<ROW = PS>(): Promise<ROW | undefined>
  bind(key: number | string, value: any): Promise<void>
  unbindAll(): Promise<void>
  close(): Promise<void>
}