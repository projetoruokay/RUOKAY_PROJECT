const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const agendamento = new Schema({
  clienteId: {
    type: mongoose.Types.ObjectId,
    ref: 'Cliente',
    required: true,
  },
  clinicaId: {
    type: mongoose.Types.ObjectId,
    ref: 'Clinica',
    required: true,
  },
  especialidadeId: {
    type: mongoose.Types.ObjectId,
    ref: 'Especialidade',
    required: true,
  },
  profissionalId: {
    type: mongoose.Types.ObjectId,
    ref: 'Profissional',
    required: true,
  },
  data: {
    type: Date,
    required: true,
  },
  valor: {
    type: Number,
    required: true,
  },
  honorario: {
    type: Number,
    required: true,
  },
  
  transactionId: {
    type: String,
    required: true,
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Agendamento', agendamento);
