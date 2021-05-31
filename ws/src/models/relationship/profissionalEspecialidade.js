const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profissionalEspecialidade = new Schema({
  profissionalId: {
    type: mongoose.Types.ObjectId,
    ref: 'Profissional',
    required: true,
  },
  especialidadeId: {
    type: mongoose.Types.ObjectId,
    ref: 'Especialidade',
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

module.exports = mongoose.model('ProfissionalEspecialidade', profissionalEspecialidade);
