const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clinicaCliente = new Schema({
  clinicaId: {
    type: mongoose.Types.ObjectId,
    ref: 'Clinica',
    required: true,
  },
  clienteId: {
    type: mongoose.Types.ObjectId,
    ref: 'Cliente',
    required: true,
  },
  status: {
    type: String,
    enum: ['A', 'I'],
    required: true,
    default: 'A',
  },
  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ClinicaCliente', clinicaCliente);
