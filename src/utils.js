let getRandomInt = (min, max)=>{
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
let getTimeString = (date) => {
    return date.toLocaleTimeString();
    return (date.getHours()+1).toString().padStart(2,'0')+':'+(date.getMinutes()).toString().padStart(2,'0');
}
export default getRandomInt;
export { getTimeString };