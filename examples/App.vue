<template>
  <div>
    <a-breadcrumb :routes="routes" :params="params">
      <!-- <template slot="itemRender" slot-scope="{ route, routes, paths }">
        <span v-if="routes.indexOf(route) === routes.length - 1">
          {{ route.breadcrumbName }}
        </span>
        <div v-else>
          {{ route.breadcrumbName }}
        </div>
      </template> -->
    </a-breadcrumb>
  </div>
</template>
<script>
export default {
  data() {
    return {
      basePath: '/components/breadcrumb',
      params: {
        age: 32,
      },
      routes: [
        {
          path: 'index',
          breadcrumbName: 'home:age',
          params: {
            age: 12,
          },
        },
        {
          path: 'first',
          breadcrumbName: 'first',
          children: [
            {
              path: '/general',
              breadcrumbName: 'General',
            },
            {
              path: '/layout',
              breadcrumbName: 'Layout',
            },
            {
              path: '/navigation',
              breadcrumbName: 'Navigation',
            },
          ],
        },
        {
          path: 'second',
          breadcrumbName: 'second',
        },
      ],
    };
  },
};
</script>
