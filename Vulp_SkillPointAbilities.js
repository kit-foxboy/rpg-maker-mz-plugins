/*:
 * @target MZ
 * 
 * @author Geoff "Kit Foxboy" Lambert
 * @plugindesc Changes skills so they must be purchased with skill points after learning them.
 * 
 * @param Dev Mode On
 * @type boolean
 * @desc Enable testing and debugging features
 * @default false
 * 
 * @param Skill Points Per Level
 * @type {number|boolean}
 * @desc The number of SPs earned per level. Set to false for custom SP progression
 * @default 1
 * 
 * @command activateSkill
 * @text Activates an actor's skill
 * @desc Activate a currently inactive skill for the actor
 * 
 * @arg actorId
 * @type actor
 * 
 * @arg skillId
 * @type skill
 * 
 * @help 
 * TODO
 */
;
(() => {

    ////PLUGIN MANAGER
    //get plugin parameters
    const runInDevMode = !!PluginManager.parameters('devModeOn');
    const skillPointsPerLevel = !!PluginManager.parameters('skillPointsPerLevel');
    

    ////PLUGIN COMMANDS
    PluginManager.registerCommand('Vulp_SkillPointAbilities', 'activateSkill', (args = {}) => {
        let { actorId, skillId } = args;
        if (runInDevMode) {
            console.assert(actorId && !isNaN(actorId), {args: args, errorMessage: "Invalid actor id"});
            console.assert(skillId && !isNaN(skillId), {args: args, errorMessage: "Invalid skill id"});
        }

        actorId = parseInt(actorId);
        skillId = parseInt(skillId);
        const actor = $gameActors.actor(actorId);
        actor.learnSkill(skillId);
    });
    

    ////SCENES AND WINDOWS
    //todo: add custom skill menu


    ////RPG MAKER OVERRIDES
    //Game_Actor
    const initActor = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function() {
        initActor.call(this);

        this._skillPoints = 0;
        this._activeSkills = [];
        this._inactiveSkills = [];
    };

    const setupActors = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        setupActors.call(this, actorId);

        //set initial SP
        const actor = $dataActors[actorId];
        let initialSP = 1;
        if (actor.meta && !!actor.meta.initialSkillPoints) {
            initalSP = parseInt(actor.meta.initialSkillPoints);
        }
        this._skillPoints = initialSP;
    };

    const initActorSkills = Game_Actor.prototype.initSkills;
    Game_Actor.prototype.initSkills = function() {
        initActorSkills.call(this);

        this._inactiveSkills = [...this._skills];
        this._activeSkills = [];
        this._skills = [];
    };

    const levelUpActor = Game_Actor.prototype.levelUp;
    Game_Actor.prototype.levelUp = function() {
        levelUpActor.call(this);

        this.levelUpSP();
    };

    const learnSkillActor = Game_Actor.prototype.learnSkill;
    Game_Actor.prototype.learnSkill = function(skillId) {
        learnSkillActor.call(this, skillId);

        this._inactiveSkills = this._inactiveSkills.filter((removeSkill) => { 
            skillId !== removeSkill
        });

        if (!this._activeSkills.find((activeSkillId) => {
            activeSkillId === skillId
        })) {
            this._activeSkills.push(skillId);
        }
    }

    Game_Actor.prototype.skillPoints = function() {
        return this._skillPoints;
    };

    Game_Actor.prototype.activeSkills = function() {
        return this._activeSkills;
    };

    Game_Actor.prototype.inactiveSkills = function() {
        return this._inactiveSkills;
    };
    
    Game_Actor.prototype.levelUpSP = function() {
        this._skillPoints += skillPointsPerLevel;
    };


    ////DEBUGGING AND DEV
    const runDevTests = async () => {
        console.log($gameActors);

        $dataActors.slice(1).map((dataActor) => {

            //test actor
            const actor = $gameActors.actor(dataActor.id);
            const actorSkills = actor.skills();
            const activeSkills = actor.activeSkills();
            const inactiveSkills = actor.inactiveSkills();

            console.assert(actor.skillPoints(), {actor: actor, errorMessage: "Skill points not set up correctly"});
            console.assert(actorSkills.length === 0, {actor: actor, errorMessage: "Skills not set up correctly"});
            console.assert(activeSkills.length === 0, {actor: actor, errorMessage: "Active Skills not set up correctly"});
            console.assert(inactiveSkills, {actor: actor, errorMessage: "Inactive Skills not set up correctly"});
            
            //test actor metadata
            let initialSP = skillPointsPerLevel;
            if (dataActor.meta && !!dataActor.meta.initialSP) {
                initialSP = parseInt(dataActor.meta.initialSP);
                console.assert(!isNaN(initialSP), 
                    { initialSP: initialSP, errorMessage: "InitialSP must be a number in notetags" }
                );
            }

            //test levelling up
            actor.levelUp();
            console.assert(actor.skillPoints() === initialSP + skillPointsPerLevel, {
                actorSP: actor.skillPoints(),
                errorMessage: "Skill points not leveling up properly"
            });

            //test skill activation
            
        });
    };

    //run tests
    if (runInDevMode) {
        const startBootScene = Scene_Boot.prototype.start;
        Scene_Boot.prototype.start = function() {
            startBootScene.call(this);

            runDevTests();
        }
    }

})();