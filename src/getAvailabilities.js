import moment from "moment";
import knex from "knexClient";

export default async function getAvailabilities(date, numberOfDays = 7) { 
  const availabilities = generateAvailabilities(date, numberOfDays);
  
  const events = await getEvents(date);

  handleEvents(events, availabilities);

  return  Array.from(availabilities.values());;
}

function generateAvailabilities(date, numberOfDays){
  const availabilities = new Map();

  for (let i = 0; i < numberOfDays; ++i) {
   
    const tmpDate = moment(date).add(i, "days");

    availabilities.set(tmpDate.format("d"), {
      date: tmpDate.toDate(),
      slots: []
    });

  }
  return availabilities;
}

function handleEvents(events, availabilities){
  for (const event of events) {
    
    handleEventForDay(event, availabilities);
  }
}

function handleEventForDay(event, availabilities){
  for (
    let date = moment(event.starts_at);
    date.isBefore(event.ends_at);
    date.add(30, "minutes")
  ) {
    const day = availabilities.get(date.format("d"));

    if (event.kind === "opening") {
      day.slots.push(date.format("H:mm"));
    } 
    
    else if (event.kind === "appointment") {
      day.slots = day.slots.filter(
        slot => slot.indexOf(date.format("H:mm")) === -1
      );
    }
  }
}

function getEvents(date) {
  return knex
    .select("kind", "starts_at", "ends_at", "weekly_recurring")
    .from("events")
    .where(function() {
      this.where("weekly_recurring", true).orWhere("ends_at", ">", + date);
    });
}
