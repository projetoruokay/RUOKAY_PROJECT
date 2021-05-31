const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clinicaProfissional = new Schema({
    clinicaId: {
      type: mongoose.Types.ObjectId,
      ref: 'Clinica',
      required: true,
    },
    profissionalId: {
      type: mongoose.Types.ObjectId,
      ref: 'Profissional',
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
  

module.exports = mongoose.model('ClinicaProfissional', clinicaProfissional);
