const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profissional = new Schema({
  nome: {
    type: String,
    required: true,
  },
  telefone: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  senha: {
    type: String,
    default: null,
  },
  foto: {
    type: String,
    default: null,
  },
  dataNascimento: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  sexo: {
    type: String,
    enum: ['M', 'F'],
    required: true,
  },
  status: {
    type: String,
    enum: ['A', 'I'],
    required: true,
    default: 'A',
  },
  
  contaBancaria: {
    titular: {
      type: String,
      required: true,
    },
    cpfCnpj: {
      type: String,
      required: true,
    },
    banco: {
      type: String,
      required: true,
    },
    tipo: {
      type: String,
      enum: ['conta_corrente', 'conta_poupanca'],
      required: true,
    },
    agencia: {
      type: String,
      required: true,
    },
    numero: {
      type: String,
      required: true,
    },
    dv: {
      type: String,
      required: true,
    },
  },
  recipientId: {
    type: String,
    required: true,
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Profissional', profissional);
