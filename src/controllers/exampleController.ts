import { Request, Response } from 'express';

export const exampleController = {
  getAll: (req: Request, res: Response) => {
    res.json({ message: 'Exemplo de controller' });
  },

  getById: (req: Request, res: Response) => {
    const { id } = req.params;
    res.json({ message: `Buscar por ID: ${id}` });
  },

  create: (req: Request, res: Response) => {
    const data = req.body;
    res.status(201).json({ message: 'Criado com sucesso', data });
  },

  update: (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    res.json({ message: `Atualizado ID: ${id}`, data });
  },

  delete: (req: Request, res: Response) => {
    const { id } = req.params;
    res.json({ message: `Deletado ID: ${id}` });
  }
};




