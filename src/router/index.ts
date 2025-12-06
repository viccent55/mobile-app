import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "/",
    // component: () => import("@/Layouts/index.vue"),
    redirect: "dashboard",
    children: [
      // {
      //   path: "",
      //   name: "Home",
      //   component: () => import("@/pages/Explore/index.vue"),
      // },
      // {
      //   path: "/article",
      //   name: "Article",
      //   component: () => import("@/pages/Article/index.vue"),
      // },
      // {
      //   path: "/forbidden",
      //   name: "Forbidden",
      //   component: () => import("@/pages/Creator/index.vue"),
      // },
      // {
      //   path: "/anime",
      //   name: "Anime",
      //   component: () => import("@/pages/Forbidden/index.vue"),
      // },
      // {
      //   path: "/user/:id",
      //   name: "User",
      //   component: () => import("@/pages/User/index.vue"),
      // },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
