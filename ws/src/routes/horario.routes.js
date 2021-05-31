const express = require('express');
const router = express.Router();
const Horario = require('../models/horario');

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

module.exports = router;
