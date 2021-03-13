const yargs = require("yargs/yargs");

module.exports = () => {
  const argv = yargs(process.argv.slice(2)).argv;

  const arg = argv.dataset;
  switch (arg) {
    case 'rooms':
        return ['./Data/hosts-stockholm.csv', arg];
    case 'reviews':
        return ['./Data/reviews-stockholm.csv', arg];
    case 'calendars':
        return ['./Data/calendar-stockholm.csv', arg];
    default:
        return ['./Data/hosts-stockholm.csv', 'rooms'];
    
  }
};
