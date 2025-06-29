import { store } from '../main.js';
import { embed, getFontColour } from '../util.js';
import { score } from '../score.js';
import { fetchEditors, fetchList } from '../content.js';

import Spinner from '../components/Spinner.js';
import LevelAuthors from '../components/List/LevelAuthors.js';

const roleIconMap = {
	owner: 'crown',
	admin: 'user-gear',
    kreo: 'kreo',
	seniormod: 'user-shield',
	mod: 'user-lock',
    trial: 'user-check',
	dev: 'code'
};

export default {
	components: { Spinner, LevelAuthors },
	template: `
        <main v-if="loading" class="surface">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container surface">
                <input type="checkbox" id="sul-checkbox" name="sul-check" value="showUnverified" @click="showUnverified = !showUnverified">
                <label for="sul-checkbox" class="sul-label">Show Pending Levels</label><br>
                <h2 class="list-separator"><i>The List</i></h2>
                <table class="list" v-if="list">
                    <tr v-for="([err, rank, level], i) in list">
                        <td class="rank">
                            <p v-if="rank != null" class="type-label-lg">#{{ rank }}</p>
                            <p v-else-if="rank == null && showUnverified" class="type-label-lg">&mdash;</p>
                        </td>
                        <td class="rank-image">
                            <img v-if="rank == 1" class="rank-trophy" src="assets/Top1Trophy.png" />
                            <img v-if="rank == 2" class="rank-trophy" src="assets/Top2Trophy.png" />
                            <img v-if="rank == 3" class="rank-trophy" src="assets/Top3Trophy.png" />
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i" v-if="rank != null">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                            <button @click="selected = i" v-else-if="rank == null && showUnverified">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container surface">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>

                    <p><i>"{{level.gdleveldescription || "(No description provided)"}}"</i></p>

                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>

                    <p>{{level.description || "No Description Provided."}}</p>

                    <div class="packs" v-if="level.packs.length > 0">
                        <div v-for="pack in level.packs" class="tag" :style="{background:pack.colour}">
                            <p :style="{color:getFontColour(pack.colour)}">{{pack.name}}</p>
                        </div>
                    </div>

                    <div v-if="level.showcase" class="tabs">
                        <button class="tab type-label-lg" :class="{selected: !toggledShowcase}" @click="toggledShowcase = false">
                            <span class="type-label-lg">Verification</span>
                        </button>
                        <button class="tab" :class="{selected: toggledShowcase}" @click="toggledShowcase = true">
                            <span class="type-label-lg">Showcase</span>
                        </button>
                    </div>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(level.rank, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                    </ul>
                    
                    <h2>Records</h2>
                    <p v-if="level.rank == null"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="level.rank + 1 <= 50"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="level.rank + 1 <= 100"><strong>100%</strong> to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container surface">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <template v-if="editors">
                        <h2>List Editors</h2>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${(store.dark || store.shitty) ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h2> List Rules </h2>
                    <p><i>read this now</i></p>
                    <h3> Rules </h3>
                    <p>Your record must not be played at over 360 fps. Your FPS must be shown.</p>
                    <p>Audible clicks are <b><i>required.</i></b> It does not matter if you have a CPS counter.</p>
                    <p>Your previous attempt/entry of the level, full completion, endscreen, and Cheat Indicator must be shown.</p>
                    <p>No secret ways or bug routes allowed.</p>
                    <p>Levels must be created and verified on Platinum 1.9 to be eligible; reuploads are ineligible.</p>
                    <p>LDM's are allowed as long as they don't make the level any easier to play or see.</p>
                    <p>Bug fixes are allowed as long as they don't nerf the level.</p>
                    <p>If on mobile, show all your Polzhax settings at the end of the video.</p>
                    <h3> Info </h3>
                    <p>Levels that fall out of the top 100 will be moves into the Legacy List.</p>
                    <p>Levels that are deemed not list-worthy will not be placed at all.</p>
                    <p>Banned members are ineligible for submitting future records.</p>
                    <p>Packs do not give bonus points; they are simply an extra incentive.</p>
                </div>
            </div>
        </main>
    `,
	data: () => ({
		list: [],
		editors: [],
		loading: true,
		selected: 0,
		errors: [],
		roleIconMap,
		store,
		toggledShowcase: false,
        showUnverified: false,
	}),
	computed: {
		level() {
			return this.list && this.list[this.selected] && this.list[this.selected][2];
		},
		video() {
			if (!this.level.showcase) {
				return embed(this.level.verification);
			}

			return embed(
				this.toggledShowcase ? this.level.showcase : this.level.verification,
			);
		},
	},
	async mounted() {
		store.list = this;
        await resetList();
	},
	methods: {
		embed,
		score,
        getFontColour
	},
};

export async function resetList() {
    console.log("resetting");
    
    store.list.loading = true;

    // Hide loading spinner
    store.list.list = await fetchList();
    store.list.editors = await fetchEditors();

    // Error handling
    if (!store.list.list) {
        store.list.errors = [
            "Failed to load list. Retry in a few minutes or notify list staff.",
        ];
    } else {
        store.list.errors.push(
            ...store.list.list
                .filter(([err, _, __]) => err)
                .map(([err, _, __]) => {
                    return `Failed to load level. (${err}.json)`;
                })
        );
        if (!store.list.editors) {
            store.list.errors.push("Failed to load list editors.");
        }
    }

    store.list.showUnverified = false;

    for(var i = 0; i < store.list.list.length; i++){
        if(store.list.list[i][1] != null){
            store.list.selected = i;
            break;
        }
    }

    store.list.loading = false;
}
