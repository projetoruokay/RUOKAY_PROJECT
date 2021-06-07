const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clinica = new Schema({
  

  nome:{
      type:String,
      required: [true, 'Nome é Obrigatório.'],
  },
  foto: String,
  capa: String,
  
  email:{
    type:String,
    required: [true, 'E-mail é Obrigatório.'],
},
  
senha:{
    type:String,
    required: null,
},
  telefone: String,
  recipientId: String,
  endereco: {
    cidade: String,
    uf: String,
    cep: String,
    logradouro: String,
    numero: String,
    pais: String,
  },
  geo: {
    type: String,
    coordinates: [Number],
  },
  
  recipientId: String,

  dataCadastro: {
    type: Date,
    default: Date.now,
  },
});

clinica.index({ geo: '2dsphere' });

module.exports = mongoose.model('Clinica', clinica);
