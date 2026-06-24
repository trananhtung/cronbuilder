export interface ParsedCron {
  minute: number[];
  hour: number[];
  dom: number[];
  month: number[];
  dow: number[];
  domStar: boolean;
  dowStar: boolean;
}

export const MONTH_LONG = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const DOW_LONG = [
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
];

export const ORDINALS = [
  "1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th",
  "11th","12th","13th","14th","15th","16th","17th","18th","19th","20th",
  "21st","22nd","23rd","24th","25th","26th","27th","28th","29th","30th","31st",
];

export const MONTH_MAP: Record<string, number> = {
  JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,
  JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12,
};

export const DOW_MAP: Record<string, number> = {
  SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6,SUNDAY:0,MONDAY:1,
  TUESDAY:2,WEDNESDAY:3,THURSDAY:4,FRIDAY:5,SATURDAY:6,
};
