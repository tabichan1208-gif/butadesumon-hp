export type BusinessSchedule={closed_weekdays:number[];open_time:string;close_time:string};
export type BusinessException={exception_date:string;kind:"CLOSED"|"OPEN";open_time:string|null;close_time:string|null;note:string|null};
export const defaultBusinessSchedule:BusinessSchedule={closed_weekdays:[1],open_time:"11:00",close_time:"18:00"};
