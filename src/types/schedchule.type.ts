import dayjs from "dayjs";
import { CoachInteface } from "./coach.type";
import { WorkoutType } from "./workouts.type";
export type CoachesType = 'Carlos' | 'Hari' | 'Cesar' | 'Eric'

export interface SchedchuleInterface{
    id:number;
    workoutType:WorkoutType;
    workoutTime: string;
    coach?: CoachesType
}