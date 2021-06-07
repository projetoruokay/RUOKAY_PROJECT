const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Horario = require('../models/horario');
const ProfissionalEspecialidade = require('../models/relationship/profissionalEspecialidade');


//POST

router.post('/', async (req, res) => {
  try {
    //Verificação se há algum horario disponivel para aquele dia na clinica
    //Se caso não houver, cadastrar.

    const horario = await new Horario(req.body).save();

    res.json({ horario });

  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

//GET

router.get('/clinica/:clinicaId', async (req, res) => {
  try {
    
    const { clinicaId } = req.params;
    const horarios = await Horario.find({
      clinicaId,
    })

    res.json({ horarios });

  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

//PUT

router.put('/:horarioId', async (req, res) => {
  try {
    
    const { horarioId } = req.params;
    const horario = req.body;

    await Horario.findByIdAndUpdate(horarioId, horario);


    res.json({ error: false});

  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

//DELETE

router.delete('/:horarioId', async (req, res) => {
  try {
    
    const { horarioId } = req.params;
    await Horario.findByIdAndDelete(horarioId);


    res.json({ error: false});

  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

//POST
router.post('/profissionais', async (req, res) => {
  try {
    const profissionalEspecialidade = await ProfissionalEspecialidade.find({
      especialidadeId: { $in: req.body.especialidades},
      status: 'A',
    })

    .populate('profissionalId', 'nome')
    .select('profissionalId -_id');

    const listaProfissional = _.uniqBy(profissionalEspecialidade, (vinculo) => vinculo
    .profissionalId._id.toString()
    ).map((vinculo) => ({ 
      label: vinculo.profissionalId.nome,
      value: vinculo.profissionalId._id,
    }));

    res.json({erro: false, listaProfissional});

  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});


module.exports = router;
