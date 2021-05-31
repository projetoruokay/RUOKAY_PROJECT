const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const horario = new Schema({
  clinicaId: {
    type: mongoose.Types.ObjectId,
    ref: 'Clinica',
    required: true,
  },
  especialidades: {
    type: [{ type: mongoose.Types.ObjectId, ref: 'Especialidade' }],
    required: true,
  },
  profissionais: {
    type: [{ type: mongoose.Types.ObjectId, ref: 'Profissional' }],
    required: true,
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
  dias: {
    type: [Number],
    required: true,
  },
  inicio: {
    type: Date,
    required: true,
  },
  fim: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('Horario', horario);
