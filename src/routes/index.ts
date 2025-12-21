import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Rotas disponíveis' });
});

export default router;




