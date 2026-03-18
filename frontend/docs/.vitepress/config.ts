import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ENIC MIS',
  description: 'User manual and technical reference for the ENIC Management Information System',
  base: '/ENIC-INTERNS-PROJECT/', // change to your GitHub repo name

  appearance: 'dark',

  themeConfig: {
    siteTitle: 'ENIC MIS Docs',

    nav: [
      { text: 'User Manual', link: '/user-manual/introduction' },
      { text: 'Technical', link: '/technical/architecture' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'v1.0.0 (current)', link: '#' },
          { text: 'Changelog', link: '#' },
        ],
      },
    ],

    sidebar: {
      '/user-manual/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/user-manual/introduction' },
            { text: 'Logging In', link: '/user-manual/logging-in' },
            { text: 'Dashboard Overview', link: '/user-manual/dashboard' },
          ],
        },
        {
          text: 'Data Cleaning Tool',
          items: [
            { text: 'Uploading a File', link: '/user-manual/uploading-file' },
            { text: 'Setting the Header Row', link: '/user-manual/header-row' },
            { text: 'Configuring Columns', link: '/user-manual/columns' },
            { text: 'Filtering & Searching', link: '/user-manual/filtering' },
            { text: 'Selecting Rows', link: '/user-manual/selecting-rows' },
            { text: 'Exporting Data', link: '/user-manual/exporting' },
          ],
        },
        {
          text: 'User Management',
          items: [
            { text: 'Managing Users', link: '/user-manual/managing-users' },
            { text: 'Roles & Privileges', link: '/user-manual/roles-privileges' },
          ],
        },
      ],

      '/technical/': [
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/technical/architecture' },
            { text: 'Data Flow', link: '/technical/data-flow' },
            { text: 'Columnar Storage', link: '/technical/columnar-storage' },
            { text: 'Date Detection', link: '/technical/date-detection' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Tech Stack', link: '/technical/tech-stack' },
            { text: 'useSpreadsheetData Hook', link: '/technical/use-spreadsheet-data' },
            { text: 'Worker Message Protocol', link: '/technical/message-protocol' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/RonRon-Dev/ENIC-INTERNS-PROJECT' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'ENIC Management Information System',
      copyright: 'Built by ENIC Interns',
    },

    editLink: {
      pattern: 'https://github.com/RonRon-Dev/ENIC-INTERNS-PROJECT/edit/main/frontend/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
