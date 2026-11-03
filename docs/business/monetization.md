Hi Marty. **My updated recommendation is to monetize ThreeD App first through paid design and presentation projects, then turn repeatable customer needs into hosted subscriptions.** The new Design capabilities make this a stronger opportunity than when we first discussed monetization.

I reviewed the current repository through the GitHub plugin, including the README, current context, recent commits, and Design, Builder, Simulation, and Dashboard documentation. As of October 19, the repository identifies **v0.26.17** as the developer-confirmed production release. This is a repository-based assessment; I have not independently tested the deployed app. [Current project status](https://github.com/marty-mcgee/threed-garden/blob/main/CONTEXT.md)

**What changes my recommendation**

Previously, I emphasized interactive gardens, education, and hosting. The app now has a broader commercial foundation:

| Current capability | Potential customer value |
|---|---|
| Integrated architectural drawing with linked 2D and 3D views | Help customers understand a proposed space |
| Walls, floors, openings, roofs, levels, measurements, and saved Projects | Develop and present editable design concepts |
| Reusable Model Library and asset importing | Build scenes around a customer’s actual products or environment |
| Procedural Cottage Builder with GLB export | Produce configurable architectural assets |
| Multimedia, including audio/video and direct Album/Track links | Add explanations, demonstrations, and storytelling |
| Characters, physics, and supported Simulations with captured Results | Create interactive demonstrations and learning exercises |

These capabilities are documented in the [README](https://github.com/marty-mcgee/threed-garden/blob/main/README.md), [Design guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/developers/THREED_DESIGNS.md), [Builder guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/developers/THREED_MODEL_BUILDER.md), and [Simulation guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/developers/THREED_SIMULATIONS.md). Their commercial value remains a hypothesis to validate with buyers.

**Updated monetization priorities**

*All prices below are suggested tests in USD—not market benchmarks or forecasts.*

| Priority | Offer | Likely buyer | Initial pricing experiment |
|---|---|---|---|
| **1** | **Done-for-you interactive property and landscape presentations** | Landscape designers, nurseries, community gardens, small property businesses | $1,500–$5,000 for a tightly scoped pilot |
| **2** | **Managed ThreeD Projects** | Customers from successful pilots | $99–$299/month for hosting, maintenance, defined storage, and limited support |
| **3** | **Branded product demonstrations** | Garden suppliers, outdoor-product manufacturers, modular-building businesses | $3,000–$10,000 setup, plus hosting |
| **4** | **Education workshops and prepared learning Projects** | Schools, makerspaces, agricultural programs | $500–$2,000 per workshop; test annual packages afterward |
| **5** | **Implementation, asset preparation, and support** | Organizations adopting the open-source app | Fixed-price onboarding or scoped retainers |
| **6** | **Original templates and configurable assets** | Creators, designers, educators | $29–$149 per pack |
| **7** | **Sponsorship and funded public improvements** | Businesses benefiting from the project | Negotiated annual sponsorships or funded milestones |

**1. Lead with a concrete customer deliverable**

The strongest first offer, in my judgment, is:

**“We turn your property or garden concept into an interactive 3D presentation that helps people understand your proposal.”**

For example, a landscape designer could commission one Project showing a proposed garden, surrounding structures, selected plants, and outdoor products. Your team would prepare the assets, configure the scene, and deliver a reviewed experience.

Start with a limited number of assets, one revision round, and a defined support period. Customer-facing delivery and sharing should be verified for each pilot.

The buyer is paying for a useful presentation and your expertise. That is an easier initial sale to test than asking them to adopt an unfamiliar editing platform.

**2. Build recurring revenue from successful delivery**

My earlier hosting recommendation still stands, but I would introduce it **after a customer has a Project worth keeping online**.

A subscription could cover:

- Hosting and routine updates.
- Storage and bandwidth allowances.
- Backups and a defined recovery service.
- A small allowance for content changes.
- Support with clear response expectations.

Price custom design work separately. Measure actual storage, delivery, and support costs before promising generous usage.

**3. Test branded showcases as a higher-value offer**

The combination of reusable Models, architecture, and multimedia suggests product demonstrations: a nursery’s sample garden, an outdoor-furniture arrangement, or a configurable cottage concept.

Charge for creating and operating the experience. Begin with one supplier and a small catalog. Embedded website delivery, purchasing integrations, and advanced configuration would need separate development and validation.

**4. Keep education focused on demonstrated behavior**

Characters and physics can make workshops engaging. Supported Simulation execution and recorded Results add material for programming and introductory physics lessons.

However, the documented runner currently supports specific navigation and kicking actions. It is not yet evidence of a general scientific simulation platform. FarmBot physical commands also remain disabled. [Simulation scope](https://github.com/marty-mcgee/threed-garden/blob/main/docs/developers/THREED_SIMULATIONS.md) · [Current limits](https://github.com/marty-mcgee/threed-garden/blob/main/CONTEXT.md)

**What I would change from our earlier plan**

- **Move design presentations and branded showcases upward.** The architectural workspace gives them a clearer foundation.
- **Keep managed hosting and services near the top.** They fit an open-source business and can start with a few customers.
- **Delay a broad consumer subscription.** First establish repeat usage and willingness to pay.
- **Delay a public asset marketplace.** Start with a small collection of original, rights-cleared templates.
- **Use multimedia to strengthen customer experiences.** A standalone media subscription would be a separate business hypothesis.

**Commercial readiness needs focused verification**

The documentation records remaining acceptance work around Builder uploads and placement, some saved workspace fields, and device/browser behavior. It also notes that owner-scoped records do not automatically make public Blob files confidential. Consequently, I would avoid promising confidential client asset hosting until file access is verified end to end. [Builder boundaries](https://github.com/marty-mcgee/threed-garden/blob/main/docs/developers/THREED_MODEL_BUILDER.md)

Similarly, sell architectural features as **concept design and visualization** unless you separately establish construction-grade accuracy and deliverables. Confirm redistribution rights before including third-party assets in commercial packs.

**My proposed Board decision**

Authorize a **90-day paid-pilot program**:

1. Interview 10–15 prospects across landscape/design businesses and product suppliers.
2. Select one audience and produce one polished demonstration.
3. Seek three paid pilots with fixed scope.
4. Track delivery hours, operating costs, customer usage, and requests for continued service.
5. Decide whether the evidence supports a repeatable hosted offering.

The most useful success measure is **customers paying enough to cover delivery and showing interest in continuing**. ThreeD App now offers more ways to create value; the next marketing task is to identify which specific outcome buyers value most.