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
    

    ////SCENES AND WINDOWS



    ////RPG MAKER OVERRIDES
    //Game_Actor
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

        this._activeSkills = [];
        this._inactiveSkills = [...this._skills];
        this._skills = [];
    };

    const levelUpActor = Game_Actor.prototype.levelUp;
    Game_Actor.prototype.levelUp = function() {
        levelUpActor.call(this);

        this.levelUpSP();
    };

    Game_Actor.prototype.skillPoints = function() {
        return this._skillPoints;
    };
    
    Game_Actor.prototype.levelUpSP = function() {
        this._skillPoints += skillPointsPerLevel;
    };


    ////DEBUGGING AND DEV
    const runDevTests = async () => {

        const tests = $dataActors.slice(1).map((dataActor) => {

            //test actor
            const actor = $gameActors.actor(dataActor.id);
            console.assert(actor._skillPoints, {actor: actor, errorMessage: "Skill points not setup correctly"});
            
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

            //test skills
            // $data
        });
    };

    if (runInDevMode) {
        const startBootScene = Scene_Boot.prototype.start;
        Scene_Boot.prototype.start = function() {
            startBootScene.call(this);

            runDevTests();
        }
    }

})();