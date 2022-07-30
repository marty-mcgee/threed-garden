<template>
  <div>
    EDITOR -- tiny mce
    <!-- <editor api-key="9pbejhvhhgrhtfgqnu32zunmtlrdi5zt1xaw2dcuhn552pw4" :init="myInit" /> -->
    <editor api-key="9pbejhvhhgrhtfgqnu32zunmtlrdi5zt1xaw2dcuhn552pw4" />
  </div>
</template>
<script>
// import { defineComponent } from "vue"

definePageMeta({
  layout: "custom", // default | dashboard | threed | custom
  title: "Editor (tinymce)",
})

// export default defineComponent({
//   data() {
//     return {
//       myInit: {
//         language: "en",
//         branding: false,
//         menubar: true,
//         // fullpage_hide_in_source_view: true,
//         // force_br_newlines: false,
//         // force_p_newlines: false,
//         // forced_root_block: false,
//         // selector: "textarea#mce",
//         // content_css: "document",
//         content_style: `
//             *                         { padding:0; margin:0; }
//             html, body                { height:100%; }
//             img                       { max-width:100%; display:block;height:auto; }
//             a                         { text-decoration: none; }
//             iframe                    { width: 100%; }
//             p                         { line-height:1.6; margin: 0px; font-size: 16px; font-family:Montserrat,  sans-serif}
//             table                     { word-wrap:break-word; word-break:break-all; max-width:100%; border:none; border-color:#999; }
//             .mce-object-iframe        { width:100%; box-sizing:border-box; margin:0; padding:0; }
//             ul,ol                     { list-style-position:inside; }
//             body, td, pre {
//             font-family: Montserrat, sans-serif;
//             font-size: 1rem; color:#000;
// }
//           `,
//         height: 300,

//         plugins:
//           "print preview paste importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor insertdatetime advlist lists wordcount textpattern noneditable help charmap quickbars emoticons",
//         toolbar:
//           "customInsertButton code undo redo | bold italic underline strikethrough | fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen preview save print | insertfile image media template link anchor codesample | ltr rtl",
//         templates: [
//           {
//             title: "Video Unit",
//             description: "Video with Text",
//             url: "/../../templates/video1.html",
//           },
//           {
//             title: "Video Unit2",
//             description: "Video with Text2",
//             url: "/../../templates/video2.html",
//           },
//           {
//             title: "Text with Blocks",
//             description: "Section with Text",
//             url: "/../../templates/text-2b.html",
//           },
//           {
//             title: "Page Template",
//             description: "Sample Page",
//             url: "/../../templates/test.html",
//           },
//         ],
//       },
//     };
//   },
// })
</script>
