export {
  paginationQuerySchema,
  idParamSchema,
  cuidParamSchema,
  uuidParamSchema,
} from './common.validator';
export type { PaginationQuery, IdParam } from './common.validator';

export { registerSchema, loginSchema, refreshSchema } from './auth.validator';
export type { RegisterInput, LoginInput, RefreshInput } from './auth.validator';

export {
  updateProfileSchema,
  changePasswordSchema,
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} from './users.validator';
export type {
  UpdateProfileInput,
  ChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
  ListUsersQuery,
} from './users.validator';

export {
  createLeadSchema,
  updateLeadSchema,
  listLeadsQuerySchema,
  assignLeadSchema,
  convertLeadSchema,
} from './leads.validator';
export type {
  CreateLeadInput,
  UpdateLeadInput,
  ListLeadsQuery,
  AssignLeadInput,
  ConvertLeadInput,
} from './leads.validator';

export {
  createClientSchema,
  updateClientSchema,
  listClientsQuerySchema,
  listClientDealsQuerySchema,
  listClientActivitiesQuerySchema,
} from './clients.validator';
export type {
  CreateClientInput,
  UpdateClientInput,
  ListClientsQuery,
  ListClientDealsQuery,
  ListClientActivitiesQuery,
} from './clients.validator';

export {
  createDealSchema,
  updateDealSchema,
  updateDealStageSchema,
  updateDealProbabilitySchema,
  listDealsQuerySchema,
  kanbanQuerySchema,
  dealStatsQuerySchema,
} from './deals.validator';
export type {
  CreateDealInput,
  UpdateDealInput,
  UpdateDealStageInput,
  UpdateDealProbabilityInput,
  ListDealsQuery,
  KanbanQuery,
  DealStatsQuery,
} from './deals.validator';

export {
  createActivitySchema,
  updateActivitySchema,
  markCompletedSchema,
  listActivitiesQuerySchema,
  upcomingActivitiesQuerySchema,
  timelineQuerySchema,
  myActivitiesQuerySchema,
} from './activities.validator';
export type {
  CreateActivityInput,
  UpdateActivityInput,
  MarkCompletedInput,
  ListActivitiesQuery,
  UpcomingActivitiesQuery,
  TimelineQuery,
  MyActivitiesQuery,
} from './activities.validator';

export {
  overviewQuerySchema,
  revenueByMonthQuerySchema,
  topSalesRepsQuerySchema,
  leadsBySourceQuerySchema,
  pipelineQuerySchema,
} from './dashboard.validator';
export type {
  OverviewQuery,
  RevenueByMonthQuery,
  TopSalesRepsQuery,
  LeadsBySourceQuery,
  PipelineQuery,
} from './dashboard.validator';
