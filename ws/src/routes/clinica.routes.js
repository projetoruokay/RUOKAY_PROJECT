const express = require('express');
const router = express.Router();
const Clinica = require('../models/clinica');
const Especialidade = require('../models/especialidade');
const turf = require('@turf/turf');

//POST 

router.post('/', async (req, res) => {
  try {
    const clinica = await new Clinica(req.body).save();
    res.json({ clinica });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

//GET

router.get('/especialidade/:clinicaId', async (req, res) => {
  try {
    const { clinicaId } = req.params;
    const especialidades = await Especialidade.find({
        clinicaId,
      status: 'A',
    }).select('_id titulo');

    res.json({
      error: false,
      especilidade: especialidades.map((s) => ({ label: s.titulo, value: s._id })),
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

//GET

router.get('/:id', async (req, res) => {
  try{
    const clinica = await Clinica.findById(req.params.id).select('capa nome endereco.cidade geo.coordinates telefone');

    //DISTANCIA 
    const distance = turf.distance(
     // turf.point([clinica.geo.coordinates]),
      turf.point([-23.54608, -46.60729]),

      //Ponto de Localização do Usuario - Longitude e Latitude, Universidade São Judas Tadeu
      turf.point([-23.55153, -46.59773])
    );

    res.json({error: false, clinica, distance})
  }catch(err){
    res.json({error: true, message: err.message})
  }
})

module.exports = router;