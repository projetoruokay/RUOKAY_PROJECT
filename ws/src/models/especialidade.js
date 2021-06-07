const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const especialidade = new Schema({
  clinicaId: {
    type: mongoose.Types.ObjectId,
    ref: 'Clinica',
  },
  titulo: {
    type: String,
    required: true,
  },
  preco: {
    type: Number,
    required: true,
  },
  honorario: {
    type: Number,
    required: true,
  },
  duracao: {
    type: Date,
    required: true,
  },
  recorrencia: {
    type: Number,
    required: true,
    default: 30,
  },
  descricao: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['A', 'I', 'E'],
    required: true,
    default: 'A',
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Especialidade', especialidade);
