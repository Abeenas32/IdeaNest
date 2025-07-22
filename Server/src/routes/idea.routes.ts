import { Router } from "express";
import { ideaController } from "../controllers/idea,controllers";
import { validate } from "../middleware/validation.middleware";
import { authenticate,optionalAuth } from "../middleware/auth.middleware";
import {createIdeaSchema, updateIdeaSchema, getIdeasSchema,getIdeaByIdSchema} from "../validators/idea.validator";
 

 const router = Router();
  router.get('/', validate(getIdeasSchema), ideaController.getIdeas);
  router.get('/:id', validate(getIdeaByIdSchema), ideaController.getIdeaById);
  router.post('/', optionalAuth, validate(createIdeaSchema), ideaController.createIdea);
  router.put('/:id', authenticate, validate(updateIdeaSchema), ideaController.updateIdea);
  router.delete('/:id', authenticate, validate(updateIdeaSchema), ideaController.deleteIdea);
  router.get('/user/my-ideas', authenticate, ideaController.getUserIdeas);

  export { router as ideaRoutes };
  // This router handles all the idea related routes, including creating, updating, deleting, and fetching ideas.
  // It uses validation middleware to ensure that the request data conforms to the expected schema.