export type Movement = {
  name: string;
  data: MovementData[];
  // pr: number;
  // date: string;
};


export type MovementData = {
  date: string;
  weight: number;
  reps: number;
  set: number;
};

export type OldMovement = {
  name: string;
  pr: number;
  date: string;
}
