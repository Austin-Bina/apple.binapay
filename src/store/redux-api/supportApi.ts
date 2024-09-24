import { createPendingMessage } from "@helpers/chat-messages";
import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { AddResponseBody, SupportChat, SupportDepartment, SupportTicket } from "@type/support";

type ListDepartmentsResponse = {
  departments: SupportDepartment[];
};

type CreateTicketBody = {
  department_id: string;
  subject: string;
  description: string;
  attachment?: string;
};

type CreateTicketResponse = {
  message: string;
  ticket_id: string;
};

type ViewTicketResponse = {
  ticket: SupportTicket;
};

type ViewTicketBody = {
  ticketId: string;
};

type AddResponseResponse = {
  message: string;
};

type ConversationResponse = {
  data: {
    total_replies: number;
    pages: number;
    conversation: SupportChat[];
  };
};

type ConversationBody = {
  conversationId: string;
};

type HistoryResponse = {
  data: {
    total_tickets: number;
    pages: number;
    tickets: SupportTicket[];
  };
};

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Support Department", "Support Chat", "Support History"],
  endpoints: (builder) => ({
    initiateSupport: builder.mutation<void, void>({
      query: () => ({
        url: route("support.initiate"),
        method: "POST",
      }),
    }),
    getSupportDepartments: builder.query<ListDepartmentsResponse, void>({
      query: () => ({
        url: route("support.departments"),
        method: "GET",
      }),
      providesTags: [{ type: "Support Department" }],
      transformResponse: (response: ListDepartmentsResponse) => ({
        departments: response.departments ?? [],
      }),
    }),
    createSupportTicket: builder.mutation<CreateTicketResponse, CreateTicketBody>({
      query: (body) => ({
        url: route("support.createTicket"),
        method: "POST",
        data: body,
      }),
    }),
    viewSupportTicket: builder.query<ViewTicketResponse, ViewTicketBody>({
      query: (body) => ({
        url: route("support.viewTicket", { params: { ticketId: body.ticketId } }),
        method: "GET",
      }),
    }),
    addResponse: builder.mutation<AddResponseResponse, AddResponseBody>({
      query: (body) => ({
        url: route("support.addResponse", { params: { ticketId: body.ticketId } }),
        method: "POST",
        data: body,
      }),
      onQueryStarted: async (body, { dispatch, queryFulfilled }) => {
        const newMessage = createPendingMessage(body);
        const conversationId = body.ticketId;

        // Add the new message to the conversation and push it to the front
        const patchedResult = dispatch(
          supportApi.util.updateQueryData("listConversations", { conversationId }, (draft) => {
            draft.data.conversation.unshift(newMessage);
          }),
        );

        try {
          await queryFulfilled;

          const updatedMessage = createPendingMessage(body, {
            id: newMessage.id,
            clientStatuses: {
              sent: true,
              received: true,
              pending: false,
            },
          });

          dispatch(
            supportApi.util.updateQueryData("listConversations", { conversationId }, (draft) => {
              const index = draft.data.conversation.findIndex((msg) => msg.id === newMessage.id);
              if (index !== -1) {
                draft.data.conversation[index] = updatedMessage;
              }
            }),
          );
        } catch (error) {
          patchedResult.undo();
        }
      },
    }),
    listConversations: builder.query<ConversationResponse, ConversationBody>({
      query: (body) => ({
        url: route("support.conversations", { params: { conversationId: body.conversationId } }),
        method: "GET",
      }),
      providesTags: ["Support Chat"],
      transformResponse: (response: ConversationResponse) => ({
        data: response.data
          ? {
              ...response.data,
              conversation: response.data.conversation.sort((a, b) => parseInt(b.date) - parseInt(a.date)),
            }
          : { total_replies: 0, pages: 0, conversation: [] },
      }),
    }),
    getSupportHistory: builder.query<HistoryResponse, void>({
      query: () => ({
        url: route("support.history"),
        method: "GET",
      }),
      providesTags: ["Support History"],
      transformResponse: (response: HistoryResponse) => ({
        data: response.data
          ? {
              ...response.data,
              tickets: response.data.tickets.sort((a, b) => parseInt(b.last_update) - parseInt(a.last_update)),
            }
          : { total_tickets: 0, pages: 0, tickets: [] },
      }),
    }),
  }),
});

export const {
  useGetSupportDepartmentsQuery,
  useCreateSupportTicketMutation,
  useViewSupportTicketQuery,
  useAddResponseMutation,
  useListConversationsQuery,
  useGetSupportHistoryQuery,
  useInitiateSupportMutation,
} = supportApi;
