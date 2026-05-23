export { getHealthStatus } from './health.service';
export type { HealthStatus } from './health.service';
export * as authService from './auth.service';
export type { AuthTokens, LoginResult } from './auth.service';
export * as usersService from './users.service';
export type { PublicUser } from './users.service';
export * as leadsService from './leads.service';
export type {
  Requester,
  LeadWithAssignee,
  ConvertLeadResult,
} from './leads.service';

export * as clientsService from './clients.service';
export type {
  ClientWithDealCount,
  ClientDetail,
  ClientStats,
} from './clients.service';

export * as dealsService from './deals.service';
export type {
  DealWithRelations,
  DealDetail,
  DealStats,
  KanbanBoard,
  KanbanColumn,
} from './deals.service';

export * as activitiesService from './activities.service';
export type {
  ActivityWithRelations,
  UpcomingResult,
} from './activities.service';

export * as dashboardService from './dashboard.service';
export type {
  DashboardOverview,
  DashboardKpis,
  RevenueByMonthPoint,
  LeadsBySourceItem,
  PipelineColumn,
  TopSalesRep,
  UpcomingActivityItem,
} from './dashboard.service';

export * as notificationsService from './notifications.service';
export type { NotificationPayload } from './notifications.service';

export * as searchService from './search.service';
export type { GlobalSearchResult } from './search.service';
