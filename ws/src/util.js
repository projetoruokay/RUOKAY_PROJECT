const moment = require('moment');

module.exports = {
  SLOT_DURATION: 30, // MINUTOS
  isOpened: async (horarios) => {
   
    //Verificação se possui registro para aquele dia da semana

    const horariosDia = horarios.filter((h) => h.dias.includes(moment().day()));
    if (horariosDia.length > 0) {
      
      // Verificando os horarios

      for (let h of horariosDia) {
        const inicio = moment(moment(h.inicio).format('HH:mm'), 'HH:mm:ss');
        const fim = moment(moment(h.fim).format('HH:mm'), 'HH:mm:ss');
        if (moment().isBetween(inicio, fim)) {
          return true;
        }
      }
      return false;
    }
    return false;
  },

  // Receber um preço e efetuar o replace de pontos e virgulas para nada e conveeter para Inteiro.

  toCents: (price) => {
    return parseInt(price.toString().replace('.', '').replace(',', ''));
  },

  //Receber uma data e uma hora e efetuar o concatenado entre eles 

  mergeDateTime: (date, time) => {
    const merged = `${moment(date).format('YYYY-MM-DD')}T${moment(time).format(
      'HH:mm'
    )}`;
    return merged;
  },

  //Reparte os minutos em "partes"

  sliceMinutes: (start, end, duration, validation = true) => {
    const slices = [];
    let count = 0;

    start = moment(start);
  
    end = moment(end);

    while (end > start) {
      slices.push(start.format('HH:mm'));
      start = start.add(duration, 'minutes');
      count++;
    
  }
  return slices;
},

  //Conversão de horas para minutos

  hourToMinutes: (hourMinute) => {
    const [hour, minutes] = hourMinute.split(':');
    return parseInt(parseInt(hour) * 60 + parseInt(minutes));
  },

  //Criar um array de duas dimensões
  
  splitByValue: (array, value) => {
    let newArray = [[]];
    array.forEach((item) => {
      if (item !== value) {
        newArray[newArray.length - 1].push(item);
      } else {
        newArray.push([]);
      }
    });
    return newArray;
  },
};
