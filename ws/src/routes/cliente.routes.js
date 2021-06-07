const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const pagarme = require('../services/pagarme');
const Cliente = require('../models/cliente');
const ClinicaCliente = require('../models/relationship/clinicaCliente')


router.post('/', async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { cliente, clinicaId } = req.body;
    let newCliente = null;

    const existentCliente = await Cliente.findOne({
      $or: [
        { email: cliente.email },
        { telefone: cliente.telefone },
      ],
    });

    if (!existentCliente) {
      const _id = mongoose.Types.ObjectId();



      
      const pagarmeCostumer = await pagarme('/customers', {
        external_id: _id,
        name: cliente.nome,
        type: cliente.documento.tipo === 'cpf' ? 'individual' : 'corporation',
        country: cliente.endereco.pais,
        email: cliente.email,
        documents: [
          {
            type: cliente.documento.tipo,
            number: cliente.documento.numero,
          },
        ],
        phone_numbers: [cliente.telefone],
        birthday: cliente.dataNascimento,
      });


      if (pagarmeCostumer.error) {
        throw pagarmeCostumer;
      }


      //criando cliente

      newCliente = await Cliente({
        _id,
        ...cliente,
        customerId: pagarmeCostumer.data.id,
      }).save({ session });
    }

    //RELACIONAMENTO
    const clienteId = existentCliente
    ? existentCliente._id
    : newCliente._id;

    //Verufuca ja existe o relacionamento com a clinica
    const existentRelationship = await ClinicaCliente.findOne({
      clinicaId,
      clienteId,
      status: { $ne: 'E'},
    });

      //se nao esta vinculado
    if (!existentRelationship) {
      await new ClinicaCliente({
        clinicaId,
        clienteId,
      }).save({ session });
    }

    //se ja existir o vinculo entre cliente e a clinica
    if(existentCliente){
      await ClinicaCliente.findOneAndUpdate({
        clinicaId,
        clienteId,
      },
      {status: 'A'},
      {session}
      );
    }
   
    await session.commitTransaction();
    session.endSession();
    
    if (existentCliente && existentRelationship){
      res.json({error: true, message: 'Colaborador já cadastrado'});
    }else{
    res.json({ error: false});
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
  }
});

router.post('/filter', async (req, res) => {
  try {
    const clientes = await Cliente.find(req.body.filters);
    res.json({ error: false, clientes });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.get('/clinica/:clinicaId', async (req, res) => {
  try {
    const { clinicaId } = req.params;

    const clientes = await ClinicaCliente.find({
      clinicaId,
      status: { $ne: 'E'},
    })

    .populate('clienteId')
    .select('clienteId dataCadastro');

    res.json({
      error: false,
      clientes: clientes.map((vinculo) => ({
        ...vinculo.clienteId._doc,
        vinculoId: vinculo._id,
        dataCadastro: vinculo.dataCadastro,
      })),
    });
    
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.delete('/vinculo/:id', async (req, res) => {
  try{
    await ClinicaCliente.findByIdAndUpdate(req.params.id, { status: 'E'});
    res.json({ error: false});
  } catch (err) {
    res.json({ error: true, message: err.message});
  }
});


module.exports = router;