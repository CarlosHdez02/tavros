import { SchedchuleInterface } from "@/types/schedchule.type";

export const schedchuleData: SchedchuleInterface[] = [
  // Morning Instructor Classes (06:00–12:00)
  {
    id: 2,
     workoutType: "Group class",
    workoutTime: "07:00",
    coach: "Hari",
  },
  {
    id: 3,
    workoutType: "Group class",
    workoutTime: "09:00",
    coach: "Cesar",
  },
  {
    id: 4,
   workoutType: "Group class",
    workoutTime: "10:00",
    coach: "Carlos",
  },
  {
    id: 5,
    workoutType: "Private",
    workoutTime: "11:00",
    coach: "Hari",
  },
  // Open Gym (13:00–17:00)
  {
    id: 7,
    workoutType: "Open Gym",
    workoutTime: "13:00-17:00",
  },
  

  // Evening Instructor Classes (18:00–23:00)
  {
    id: 12,
     workoutType: "Group class",
    workoutTime: "18:00",
    coach: "Carlos",
  },
  {
    id: 13,
     workoutType: "Group class",
    workoutTime: "19:00",
    coach: "Cesar",
  },
  {
    id: 14,
     workoutType: "Group class",
    workoutTime: "20:00",
    coach: "Hari",
  },
  {
    id: 15,
   workoutType: "Group class",
    workoutTime: "21:00",
    coach: "Carlos",
  },
  {
    id: 16,
  workoutType: "Group class",
    workoutTime: "22:00",
    coach: "Cesar",
  },
];
