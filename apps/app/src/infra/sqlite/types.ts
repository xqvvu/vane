export type IsoDateTimeString = string;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
