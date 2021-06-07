const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const pagarme = require('../services/pagarme');
const Profissional = require('../models/profissional');
const ClinicaProfissional = require('../models/relationship/clinicaProfissional');
const ProfissionalEspecialidade = require('../models/relationship/profissionalEspecialidade');

//POST

router.post('/', async (req, res) => {
  const db = mongoose.connection;
  const session = await db.startSession();
  session.startTransaction();

  try {
    const { profissional, clinicaId } = req.body;
    let newProfissional = null;

    // Verificar se o profissional já possui cadastro
    const existentProfissional = await Profissional.findOne({
      $or: [
        { email: profissional.email },
        { telefone: profissional.telefone },
        { cpf: profissional.cpf },
      ],
    });

    if (!existentProfissional) {
      
      //Efetuando o cadastro da conta bancaria

      const { contaBancaria } = profissional;
      const pagarmeBankAccount = await pagarme('/bank_accounts', {
        bank_code: contaBancaria.banco,
        document_number: contaBancaria.cpfCnpj,
        agencia: contaBancaria.agencia,
        conta: contaBancaria.numero,
        conta_dv: contaBancaria.dv,
        type: contaBancaria.tipo,
        legal_name: contaBancaria.titular,
      });

      if (pagarmeBankAccount.error) {
        throw pagarmeBankAccount;
      }

      // Criar o recebedor 

      const pagarmeRecipient = await pagarme('/recipients', {
        bank_account_id: pagarmeBankAccount.data.id,
        transfer_interval: 'daily',
        transfer_enabled: true,
      });

      if (pagarmeBankAccount.error) {
        throw pagarmeRecipient;
      }

        // Criando o profissional

      newProfissional = await new Profissional({
        ... profissional,
        recipientId: pagarmeRecipient.data.id,
      }).save({ session });
    }

    const profissionalId = existentProfissional
      ? existentProfissional._id
      : newProfissional._id;

    // Verificar Relacionamento com a Clinica 
    
    const existentRelationship = await ClinicaProfissional.findOne({
      clinicaId,
      profissionalId,
      status: { $ne: 'E'},
    });

      // Se não possuir vinculo

    if (!existentRelationship) {
      await new ClinicaProfissional({
        clinicaId,
        profissionalId,
        status: profissional.vinculo,
      }).save({ session });
    }

     // Se possuir vinculo

    if (existentRelationship) {
     await ClinicaProfissional.findOneAndUpdate(
        {
          clinicaId,
          profissionalId,
        },
        { status: profissional.vinculo },
        { session }
      );
    }

    // Relacionamento - Especialidades 

    await ProfissionalEspecialidade.insertMany(
      profissional.especialidades.map((especialidadeId) => ({
        especialidadeId,
        profissionalId,
      }),
      { session }
      )
    );

    await session.commitTransaction();
    session.endSession();

    // Caso o profissional já esteja cadastrado

    if (existentRelationship && existentProfissional) {
      res.json({ error: true, message: 'Profissional já cadastrado!' });
    } else {
      res.json({ error: false });
    }

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.json({ error: true, message: err.message });
  }
});

//PUT

router.put('/:profissionalId', async (req, res) => {
  try{

    const { vinculo, vinculoId, especialidades } = req.body;
    const { profissionalId } = req.params;

    //Vinculo - Localizar o profissional que tem vinculo com a clinica

    await ClinicaProfissional.findByIdAndUpdate(vinculoId, { status: vinculo});

    //Vinculo - Localizar o profissional que tem vinculo com a especialidade

    await ProfissionalEspecialidade.deleteMany({
      profissionalId,
    });

    await ProfissionalEspecialidade.insertMany(
      especialidades.map((especialidadeId) => ({
        especialidadeId,
        profissionalId,
      }))
    );

    res.json({ error: false})

  } catch (err) {
    res.json({ error: true, message: err.message});
  }
});

//GET

router.get('/clinica/:clinicaId', async (req, res) => {
  try{

    const { clinicaId } = req.params;
    let listaProfissional = [];

    // Recuperar vinculos
    const clinicaProfissional = await ClinicaProfissional.find({
      clinicaId,
      status: { $ne: 'E'},

    })
    .populate({ path: 'profissionalId', select: '-senha -recipientId' })
    .select('profissionalId dataCadastro status');

    for (let vinculo of clinicaProfissional){
      const especialidades = await ProfissionalEspecialidade.find({
        profissionalId: vinculo.profissionalId._id
      });

      listaProfissional.push({
        ... vinculo._doc, 
        especialidades,
      });
    }

    res.json({ 
      error: false,
      profissionais: listaProfissional.map((vinculo) => ({
        ...vinculo.profissionalId._doc,
        vinculoId: vinculo._id,
        vinculo: vinculo.status,
        especialidades: vinculo.especialidades,
        dataCadastro: vinculo.dataCadastro,

    }))
    });
    
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
})

module.exports = router;
